import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import Keycloak from 'keycloak-js';

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
  const keycloakRef = useRef<Keycloak | null>(null);

  useEffect(() => {
    if (!keycloakRef.current) {
      keycloakRef.current = createKeycloakInstance(config);

      const keycloak = keycloakRef.current;

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
          }
          
          setInitialized(true);
        })
        .catch((error: unknown) => {
          console.error('Keycloak initialization error:', error);
          setInitialized(true);
        });
    }
  }, [config]);

  return (
    <KeycloakContext.Provider 
      value={{ 
        keycloak: keycloakRef.current || ({} as Keycloak), 
        initialized,
        user
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