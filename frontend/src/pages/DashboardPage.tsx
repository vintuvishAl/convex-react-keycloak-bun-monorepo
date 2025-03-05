import React from 'react';
import { useKeycloak } from '@/KeycloakProvider';
import { Button } from '@/components/ui/button';
import TasksPage from './TasksPage';

const DashboardPage: React.FC = () => {
  const { user, keycloak } = useKeycloak();

  return (
    <div className="p-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="bg-card rounded-lg shadow-md p-8 mb-8 text-card-foreground">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <Button 
              variant="outline"
              onClick={() => keycloak.logout({ redirectUri: window.location.origin })}
            >
              Sign Out
            </Button>
          </div>

          <div className="bg-accent border border-border rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-accent-foreground mb-3">
              Welcome, {user?.firstName || user?.username || 'User'}!
            </h2>
            <p className="text-accent-foreground">
              You've successfully authenticated with Keycloak and are viewing a protected route.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold mb-4">User Information</h3>
              <dl className="space-y-2">
                <div className="grid grid-cols-2">
                  <dt className="text-sm font-medium text-muted-foreground">Username:</dt>
                  <dd className="text-sm">{user?.username || 'N/A'}</dd>
                </div>
                <div className="grid grid-cols-2">
                  <dt className="text-sm font-medium text-muted-foreground">Email:</dt>
                  <dd className="text-sm">{user?.email || 'N/A'}</dd>
                </div>
                <div className="grid grid-cols-2">
                  <dt className="text-sm font-medium text-muted-foreground">Full Name:</dt>
                  <dd className="text-sm">
                    {(user?.firstName && user?.lastName) 
                      ? `${user.firstName} ${user.lastName}` 
                      : 'N/A'}
                  </dd>
                </div>
                <div className="grid grid-cols-2">
                  <dt className="text-sm font-medium text-muted-foreground">User ID:</dt>
                  <dd className="text-sm font-mono text-xs truncate">{user?.id || 'N/A'}</dd>
                </div>
              </dl>
            </div>

            <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold mb-4">Application Features</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 bg-primary rounded-full mr-2 mt-0.5"></div>
                  <span className="text-sm">Real-time data with Convex</span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 bg-primary rounded-full mr-2 mt-0.5"></div>
                  <span className="text-sm">OAuth 2.0 authentication via Keycloak</span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 bg-primary rounded-full mr-2 mt-0.5"></div>
                  <span className="text-sm">Modern UI with Tailwind CSS</span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 bg-primary rounded-full mr-2 mt-0.5"></div>
                  <span className="text-sm">TypeScript for type safety</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg shadow-sm">
            <TasksPage />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;