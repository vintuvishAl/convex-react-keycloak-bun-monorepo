import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useKeycloak } from '@/KeycloakProvider';

const RegisterPage: React.FC = () => {
  const { keycloak, initialized } = useKeycloak();
  const navigate = useNavigate();
  const location = useLocation();
  
  // If user was trying to access a protected route, we'll redirect them there after registration
  const from = location.state?.from?.pathname || '/dashboard';
  
  const handleRegister = () => {
    if (initialized) {
      // Redirect to Keycloak registration page
      keycloak.register({
        redirectUri: window.location.origin + from
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Create an Account</h1>
          <p className="text-slate-600 mt-2">Join us to access all features</p>
        </div>
        
        <div className="space-y-6">
          <div className="bg-slate-50 rounded-md p-4 border border-slate-200">
            <h2 className="text-sm font-medium text-slate-700 mb-2">Registration Information</h2>
            <p className="text-xs text-slate-500">
              You'll be redirected to our secure registration page where you can create your account.
              After registration, you'll have full access to all features.
            </p>
          </div>
          
          <div className="flex flex-col gap-4">
            <Button 
              onClick={handleRegister}
              className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
            >
              Create Account with Keycloak
            </Button>
            
            <div className="text-center">
              <span className="text-sm text-slate-600">
                Already have an account?{' '}
                <button
                  onClick={() => navigate('/login')}
                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Sign in
                </button>
              </span>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-slate-200">
          <div className="text-center space-y-4">
            <p className="text-sm text-slate-600">
              By creating an account, you agree to our
            </p>
            <div className="flex justify-center space-x-4 text-sm">
              <button className="text-indigo-600 hover:text-indigo-800">Terms of Service</button>
              <span className="text-slate-300">•</span>
              <button className="text-indigo-600 hover:text-indigo-800">Privacy Policy</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;