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
  const keycloakRef = useRef<Keycloak | null>(null);

  useEffect(() => {
    if (!keycloakRef.current) {
      keycloakRef.current = createKeycloakInstance(config);

      const keycloak = keycloakRef.current;
      
      // Make Keycloak instance globally available for Convex
      (window as any).keycloakInstance = keycloak;

      // Initialize Keycloak
      keycloak
        .init({
          onLoad: 'check-sso',
          pkceMethod: 'S256',
          checkLoginIframe: false,
          silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html'
        })
        .then((authenticated: boolean) => {
          console.log(
            authenticated 
              ? 'User is authenticated' 
              : 'User is not authenticated'
          );

          if (authenticated && keycloak.tokenParsed) {
            const userInfo: UserInfo = {
              id: keycloak.tokenParsed.sub,
              username: keycloak.tokenParsed.preferred_username,
              email: keycloak.tokenParsed.email,
              firstName: keycloak.tokenParsed.given_name,
              lastName: keycloak.tokenParsed.family_name
            };
            setUser(userInfo);
            
            // Verify token with backend after successful authentication
            verifyToken()
              .then(isValid => {
                setTokenVerified(isValid);
                if (!isValid) {
                  console.warn('Token verification failed, logging out');
                  keycloak.logout({ redirectUri: window.location.origin + '/login' });
                }
              })
              .catch(error => {
                console.error('Error verifying token:', error);
                setTokenVerified(false);
              });
          }
          
          setInitialized(true);
        })
        .catch((error: unknown) => {
          console.error('Keycloak initialization error:', error);
          setInitialized(true);
        });

      // Setup token refresh
      if (keycloak.authenticated) {
        // Set up token refresh
        const refreshInterval = setInterval(() => {
          keycloak
            .updateToken(70)
            .then(refreshed => {
              if (refreshed) {
                console.log('Token refreshed');
                // Verify the refreshed token
                verifyToken()
                  .then(isValid => {
                    setTokenVerified(isValid);
                    if (!isValid) {
                      console.warn('Refreshed token verification failed, logging out');
                      keycloak.logout({ redirectUri: window.location.origin + '/login' });
                    }
                  })
                  .catch(error => {
                    console.error('Error verifying refreshed token:', error);
                    setTokenVerified(false);
                  });
              }
            })
            .catch(error => {
              console.error('Failed to refresh token:', error);
              keycloak.logout();
            });
        }, 60000); // Check every minute

        return () => {
          clearInterval(refreshInterval);
        };
      }
    }
  }, [config]);

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