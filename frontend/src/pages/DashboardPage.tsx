import React, { Suspense, useEffect } from 'react';
import { useKeycloak } from '@/KeycloakProvider';
import { Button } from '@/components/ui/button';
import { Link, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import { navigation } from '@/config/navigation';
import { useRBAC } from '@/hooks/use-rbac';
import Overview from './DashboardPage/Overview';
import Products from './DashboardPage/Products';
import TasksPage from './TasksPage';

const DashboardPage: React.FC = () => {
  const { keycloak } = useKeycloak();
  const location = useLocation();
  const { hasRole, userRoles } = useRBAC();
  
  useEffect(() => {
    console.log('Current auth state:', {
      authenticated: keycloak.authenticated,
      token: keycloak.tokenParsed,
      userRoles
    });
  }, [keycloak.authenticated, keycloak.tokenParsed, userRoles]);

  // Filter navigation items based on user roles
  const authorizedNavItems = Object.values(navigation).filter(item => {
    const hasAccess = hasRole(item.roles);
    console.log(`Navigation item ${item.title}:`, {
      requiredRoles: item.roles,
      hasAccess,
      userRoles
    });
    return hasAccess;
  });

  console.log("Authorized navigation items:", authorizedNavItems);

  return (
    <div className="flex h-screen bg-background">
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <Link to="/dashboard" className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-primary"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              <span className="text-lg font-semibold">Home</span>
            </Link>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarMenu>
              {authorizedNavItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton 
                    isActive={location.pathname === item.path}
                    onClick={() => {}}
                    asChild
                  >
                    <Link to={item.path} className="flex items-center">
                      {item.icon}
                      <span className="ml-2">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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
          <Suspense fallback={
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          }>
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/products" element={<Products />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </main>
      </SidebarProvider>
    </div>
  );
};

export default DashboardPage;