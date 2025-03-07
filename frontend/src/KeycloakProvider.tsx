import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import Keycloak from 'keycloak-js';
import { verifyToken } from './convex';

// User interface
interface UserInfo {
  id?: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

// Keycloak configuration interface
interface KeycloakConfig {
  clientId: string;
  realm: string;
  url: string;
}

// Context props interface
interface KeycloakContextProps {
  keycloak: Keycloak;
  initialized: boolean;
  user: UserInfo | null;
  tokenVerified: boolean;
}

// Create the Keycloak context
const KeycloakContext = createContext<KeycloakContextProps | null>(null);

// Custom hook to use Keycloak context
export const useKeycloak = (): KeycloakContextProps => {
  const context = useContext(KeycloakContext);

  if (context === null) {
    throw new Error("useKeycloak must be used within a KeycloakProvider");
  }

  return context;
};

// Create a singleton Keycloak instance
let keycloakInstance: Keycloak | null = null;

const createKeycloakInstance = (config: KeycloakConfig): Keycloak => {
  if (!keycloakInstance) {
    keycloakInstance = new Keycloak(config);
  }
  return keycloakInstance;
};

// Keycloak Provider Component
export const KeycloakProvider: React.FC<{
  config: KeycloakConfig;
  children: ReactNode;
}> = ({ config, children }) => {
  const [initialized, setInitialized] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [tokenVerified, setTokenVerified] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const keycloakRef = useRef<Keycloak | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Cleanup function
  const cleanup = () => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    setUser(null);
    setTokenVerified(false);
    setInitialized(false);
  };

  // Initialize Keycloak
  useEffect(() => {
    const initKeycloak = async () => {
      try {
        if (!keycloakRef.current) {
          keycloakRef.current = createKeycloakInstance(config);
          const keycloak = keycloakRef.current;
          
          // Make Keycloak instance globally available for Convex
          (window as any).keycloakInstance = keycloak;

          // Initialize with silent check-sso first
          const authenticated = await keycloak.init({
            onLoad: 'check-sso',
            silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
            pkceMethod: 'S256',
            checkLoginIframe: false,
            scope: 'openid profile email',
            enableLogging: process.env.NODE_ENV === 'development',
            responseMode: 'fragment',
            flow: 'standard'
          });

          console.log(authenticated ? 'User is authenticated' : 'User is not authenticated');

          if (authenticated && keycloak.tokenParsed) {
            const userInfo: UserInfo = {
              id: keycloak.tokenParsed.sub,
              username: keycloak.tokenParsed.preferred_username,
              email: keycloak.tokenParsed.email,
              firstName: keycloak.tokenParsed.given_name,
              lastName: keycloak.tokenParsed.family_name
            };
            setUser(userInfo);
            
            // Wait for Convex to be ready before verifying token
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Initial token verification with retry
            let verificationAttempts = 0;
            const maxVerificationAttempts = 3;
            
            while (verificationAttempts < maxVerificationAttempts) {
              try {
                const isValid = await verifyToken();
                setTokenVerified(isValid);
                
                if (isValid) {
                  break;
                } else {
                  console.warn(`Token verification attempt ${verificationAttempts + 1} failed`);
                  if (verificationAttempts === maxVerificationAttempts - 1) {
                    throw new Error('Initial token verification failed after retries');
                  }
                  await new Promise(resolve => setTimeout(resolve, 1000));
                }
              } catch (error) {
                console.error(`Verification attempt ${verificationAttempts + 1} error:`, error);
                if (verificationAttempts === maxVerificationAttempts - 1) {
                  throw error;
                }
              }
              verificationAttempts++;
            }

            // Setup token refresh
            setupTokenRefresh(keycloak);
          }

          setInitialized(true);
        }
      } catch (error) {
        console.error('Keycloak initialization error:', error);
        setInitializationError(error instanceof Error ? error.message : 'Unknown error');
        cleanup();
        
        // Attempt recovery
        sessionStorage.clear();
        if (keycloakRef.current?.authenticated) {
          await keycloakRef.current.logout({
            redirectUri: window.location.origin + '/login'
          });
        }
      }
    };

    initKeycloak();

    return cleanup;
  }, [config]);

  // Setup token refresh logic
  const setupTokenRefresh = (keycloak: Keycloak) => {
    if (!keycloak.authenticated) return;

    let refreshInProgress = false;
    let lastRefreshTime = Date.now();
    const MIN_REFRESH_INTERVAL = 10000;
    const REFRESH_SAFETY_MARGIN = 120;

    refreshIntervalRef.current = setInterval(async () => {
      try {
        if (refreshInProgress || !keycloak.authenticated) {
          return;
        }

        const timeSinceLastRefresh = Date.now() - lastRefreshTime;
        if (timeSinceLastRefresh < MIN_REFRESH_INTERVAL) {
          return;
        }

        refreshInProgress = true;
        const timeToExpiry = keycloak.tokenParsed?.exp 
          ? keycloak.tokenParsed.exp - Math.floor(Date.now() / 1000)
          : 0;

        if (timeToExpiry <= REFRESH_SAFETY_MARGIN) {
          const refreshed = await keycloak.updateToken(REFRESH_SAFETY_MARGIN);
          lastRefreshTime = Date.now();
          
          if (refreshed) {
            console.log('Token refreshed');
            const isValid = await verifyToken();
            setTokenVerified(isValid);
            
            if (!isValid) {
              throw new Error('Refreshed token verification failed');
            }
          }
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
        cleanup();
        sessionStorage.clear();
        await keycloak.logout({
          redirectUri: window.location.origin + '/login'
        });
      } finally {
        refreshInProgress = false;
      }
    }, 30000);
  };

  // Show loading or error state
  if (!initialized) {
    return <div>Loading...</div>;
  }

  if (initializationError) {
    return <div>Error initializing Keycloak: {initializationError}</div>;
  }

  return (
    <KeycloakContext.Provider 
      value={{ 
        keycloak: keycloakRef.current || ({} as Keycloak), 
        initialized,
        user,
        tokenVerified
      }}
    >
      {children}
    </KeycloakContext.Provider>
  );
};

// Helper function to create Keycloak config
export const createKeycloakConfig = (): KeycloakConfig => {
  const storedConfig = localStorage.getItem('keycloak_config');
  if (storedConfig) {
    try {
      const parsedConfig = JSON.parse(storedConfig);
      return {
        clientId: parsedConfig.clientId,
        realm: parsedConfig.realm,
        url: parsedConfig.url
      };
    } catch (e) {
      console.error('Failed to parse stored Keycloak config:', e);
    }
  }
  
  // Fall back to default configuration
  return {
    clientId: 'vite-app',
    realm: 'master',
    url: 'http://localhost:8080'
  };
};