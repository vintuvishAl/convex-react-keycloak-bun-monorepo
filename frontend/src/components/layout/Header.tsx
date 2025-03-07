import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useKeycloak } from '@/KeycloakProvider';
import { useTheme } from '@/ThemeProvider';
import { Button } from '@/components/ui/button';

const Header: React.FC = () => {
  const { keycloak, user } = useKeycloak();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  // Check if a path is active
  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <header className="bg-primary text-primary-foreground shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link to="/" className="font-bold text-xl flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              <span>Home</span>
            </Link>
            
            {keycloak.authenticated && (
              <nav className="ml-10 hidden md:flex space-x-8">
                <Link 
                  to="/dashboard" 
                  className={`hover:text-primary-foreground/80 ${isActive('/dashboard') ? 'font-semibold' : ''}`}
                >
                  Dashboard
                </Link>
              </nav>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Theme toggle button */}
            <Button 
              variant="ghost" 
              onClick={toggleTheme}
              className="text-primary-foreground"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 0 1 1-9-9Z"/></svg>
              )}
              <span className="ml-2 hidden sm:inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </Button>
            
            {keycloak.authenticated ? (
              <>
                <div className="hidden md:block">
                  <span className="text-sm text-primary-foreground/80">
                    Welcome, {user?.firstName || user?.username || 'User'}
                  </span>
                </div>
                <Button 
                  variant="secondary" 
                  onClick={() => keycloak.logout({ redirectUri: window.location.origin })}
                  size="sm"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button 
                  onClick={() => keycloak.login()}
                  variant="secondary"
                  size="sm"
                >
                  Sign In
                </Button>
                <Button 
                  onClick={() => keycloak.register()}
                  variant="outline"
                  size="sm"
                  className="text-primary-foreground border-primary-foreground hover:bg-primary-foreground/10"
                >
                  Register
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;