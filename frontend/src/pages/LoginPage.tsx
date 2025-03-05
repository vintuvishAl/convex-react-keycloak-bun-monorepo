import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useKeycloak } from '@/KeycloakProvider';

const LoginPage: React.FC = () => {
  const { keycloak, initialized, user } = useKeycloak();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the intended destination from the location state, or default to dashboard
  const from = location.state?.from?.pathname || '/dashboard';
  
  // If user is already logged in, redirect them
  useEffect(() => {
    if (initialized && keycloak.authenticated) {
      navigate(from, { replace: true });
    }
  }, [initialized, keycloak.authenticated, navigate, from]);
  
  const handleLogin = () => {
    if (initialized) {
      // Redirect to Keycloak login page
      keycloak.login({
        redirectUri: window.location.origin + from
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Welcome Back</h1>
          <p className="text-slate-600 mt-2">Sign in to access your dashboard</p>
        </div>
        
        <div className="space-y-6">
          <div className="bg-slate-50 rounded-md p-4 border border-slate-200">
            <h2 className="text-sm font-medium text-slate-700 mb-2">Authentication Information</h2>
            <p className="text-xs text-slate-500">
              This application uses Keycloak for secure authentication. Clicking the button below will
              redirect you to the Keycloak authentication server.
            </p>
          </div>
          
          <div className="flex flex-col gap-4">
            <Button 
              onClick={handleLogin}
              className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
            >
              Sign in with Keycloak
            </Button>
            
            <div className="text-center">
              <span className="text-sm text-slate-600">
                Don't have an account?{' '}
                <button
                  onClick={() => navigate('/register')}
                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Create one
                </button>
              </span>
            </div>
            
            <div className="text-center text-xs text-slate-500">
              <p>Test user credentials:</p>
              <p className="font-mono bg-slate-100 px-2 py-1 rounded inline-block mt-1">
                testuser / password
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-slate-200 text-center">
          <p className="text-sm text-slate-600">
            Having trouble? Contact your system administrator
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;