import React from 'react';
import { useKeycloak } from '@/KeycloakProvider';
import { UserInfoCard } from '@/components/dashboard/UserInfoCard';

const Overview: React.FC = () => {
  const { user } = useKeycloak();

  return (
    <div className="w-full">
      <div className="bg-card rounded-lg shadow-md p-8 mb-8 text-card-foreground">
        <div className="bg-accent border border-border rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-accent-foreground mb-3">
            Welcome, {user?.firstName || user?.username || 'User'}!
          </h2>
          <p className="text-accent-foreground">
            You've successfully authenticated with Keycloak and are viewing a protected route.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <UserInfoCard user={user} />

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
      </div>
    </div>
  );
};

export default Overview;