import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useKeycloak } from '@/KeycloakProvider';
import { verifyToken } from '@/convex';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { keycloak, initialized } = useKeycloak();
  const location = useLocation();
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  useEffect(() => {
    // Only attempt verification if Keycloak is initialized and user is authenticated
    if (initialized && keycloak.authenticated) {
      setIsVerifying(true);
      verifyToken()
        .then(valid => {
          setIsVerified(valid);
        })
        .catch(error => {
          console.error('Token verification failed:', error);
          setIsVerified(false);
        })
        .finally(() => {
          setIsVerifying(false);
        });
    } else if (initialized) {
      // Not authenticated, no need to verify
      setIsVerified(false);
      setIsVerifying(false);
    }
  }, [initialized, keycloak.authenticated]);

  // If Keycloak is not initialized or token is being verified, show a loading state
  if (!initialized || (keycloak.authenticated && isVerifying)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="p-4 text-center">
          <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">
            {!initialized ? 'Loading authentication...' : 'Verifying credentials...'}
          </p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login page with the intended destination
  if (!keycloak.authenticated || isVerified === false) {
    // If token verification failed, log the user out from Keycloak
    if (keycloak.authenticated && isVerified === false) {
      console.log('Token verification failed, logging out');
      keycloak.logout({ redirectUri: window.location.origin + '/login' });
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated and token is verified, render the protected content
  return <>{children}</>;
};

export default PrivateRoute;