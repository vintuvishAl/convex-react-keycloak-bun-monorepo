import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useKeycloak } from '@/KeycloakProvider';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { keycloak, initialized } = useKeycloak();
  const location = useLocation();

  // If Keycloak is not initialized yet, show a loading state
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="p-4 text-center">
          <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Loading authentication...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login page with the intended destination
  if (!keycloak.authenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated, render the protected content
  return <>{children}</>;
};

export default PrivateRoute;