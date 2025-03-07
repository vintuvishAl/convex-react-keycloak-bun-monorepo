import React from 'react';
import { Link } from 'react-router-dom';
import { useKeycloak } from '@/KeycloakProvider';
import { Button } from '@/components/ui/button';

const Sidebar: React.FC = () => {
  const { keycloak } = useKeycloak();

  return (
    <div className="bg-card h-screen w-64 border-r border-border flex flex-col">
      {/* Sidebar header */}
      <div className="p-4 border-b border-border">
        <h2 className="font-bold text-xl">Dashboard</h2>
      </div>

      {/* Sidebar navigation links */}
      <div className="flex-grow p-4">
        <nav className="space-y-2">
          <Link 
            to="/dashboard" 
            className="block px-4 py-2 rounded-md hover:bg-accent hover:text-accent-foreground"
          >
            Dashboard
          </Link>
          <Link 
            to="/tasks" 
            className="block px-4 py-2 rounded-md hover:bg-accent hover:text-accent-foreground"
          >
            Tasks
          </Link>
          <Link 
            to="/products" 
            className="block px-4 py-2 rounded-md hover:bg-accent hover:text-accent-foreground"
          >
            Products
          </Link>
        </nav>
      </div>

      {/* Sidebar footer with logout button */}
      <div className="p-4 border-t border-border mt-auto">
        <Button 
          variant="outline"
          className="w-full"
          onClick={() => keycloak.logout({ redirectUri: window.location.origin })}
        >
          Logout
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;