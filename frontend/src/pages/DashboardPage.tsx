import React, { useState } from 'react';
import { useKeycloak } from '@/KeycloakProvider';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import TasksPage from './TasksPage';
import ProductsPage from './ProductsPage';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';

const DashboardPage: React.FC = () => {
  const { user, keycloak } = useKeycloak();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'products'>('dashboard');

  return (
   
      <div className="flex h-screen bg-background">
         <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <Link to="/" className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-primary"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              <span className="text-lg font-semibold">Home</span>
            </Link>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={activeTab === 'dashboard'}
                  onClick={() => setActiveTab('dashboard')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="9" x2="9" y1="21" y2="9"/></svg>
                  Dashboard
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={activeTab === 'tasks'}
                  onClick={() => setActiveTab('tasks')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><rect width="8" height="8" x="3" y="3" rx="1"/><rect width="8" height="8" x="13" y="3" rx="1"/><rect width="8" height="8" x="3" y="13" rx="1"/><rect width="8" height="8" x="13" y="13" rx="1"/></svg>
                  Tasks
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={activeTab === 'products'}
                  onClick={() => setActiveTab('products')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="m2 7 4.5-2.5 4.5 2.5 4.5-2.5 4.5 2.5V17l-4.5 2.5-4.5-2.5-4.5 2.5L2 17V7z"/><path d="M11 9.5v5"/><path d="M6.5 7v5"/><path d="M16 7v5.5"/></svg>
                  Products
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          
          <SidebarFooter>
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => keycloak.logout({ redirectUri: window.location.origin })}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
              Logout
            </Button>
          </SidebarFooter>
        </Sidebar>
        <SidebarTrigger />
        <main className="flex-1 overflow-auto p-5 mt-4">
       
          {activeTab === 'dashboard' && (
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
                        <dd className="text-xs font-mono truncate">{user?.id || 'N/A'}</dd>
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
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="w-full">
              <div className="bg-card rounded-lg shadow-md p-8 mb-8 text-card-foreground">
                <TasksPage />
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="w-full">
              <div className="bg-card rounded-lg shadow-md p-8 mb-8 text-card-foreground">
                <ProductsPage />
              </div>
            </div>
          )}
        </main>
        </SidebarProvider>
        {/* Main content area */}
       
      </div>
   
  );
};

export default DashboardPage;