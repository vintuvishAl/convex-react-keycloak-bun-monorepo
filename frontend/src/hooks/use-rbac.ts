import { useKeycloak } from '@/KeycloakProvider';

export function useRBAC() {
  const { keycloak } = useKeycloak();
  const userId = keycloak.tokenParsed?.sub;

  const hasRole = (requiredRoles?: string[]) => {
    if (!requiredRoles || requiredRoles.length === 0) return true;
    if (!userId || !keycloak.tokenParsed?.realm_access?.roles) {
      console.log('No user ID or roles found in token:', {
        userId,
        tokenRoles: keycloak.tokenParsed?.realm_access?.roles
      });
      return false;
    }
    
    const userRoles = keycloak.tokenParsed.realm_access.roles;
    console.log('Checking roles:', {
      userRoles,
      requiredRoles,
      hasRequired: requiredRoles.some(role => userRoles.includes(role))
    });
    return requiredRoles.some(role => userRoles.includes(role));
  };

  return {
    hasRole,
    userRoles: keycloak.tokenParsed?.realm_access?.roles || []
  };
}