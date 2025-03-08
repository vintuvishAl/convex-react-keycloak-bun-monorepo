import { ReactNode, lazy } from 'react';

export interface NavItem {
  title: string;
  path: string;
  icon: ReactNode;
  roles?: string[];
  component: React.LazyExoticComponent<any>;
}

export interface NavigationConfig {
  [key: string]: NavItem;
}

const DashboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="9" x2="9" y1="21" y2="9"/></svg>
);

const TasksIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="8" x="3" y="3" rx="1"/><rect width="8" height="8" x="13" y="3" rx="1"/><rect width="8" height="8" x="3" y="13" rx="1"/><rect width="8" height="8" x="13" y="13" rx="1"/></svg>
);

const ProductsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
);

export const navigation: NavigationConfig = {
  dashboard: {
    title: 'Dashboard',
    path: '/dashboard',
    icon: <DashboardIcon />,
    component: lazy(() => import('../pages/DashboardPage/Overview')),
  },
  tasks: {
    title: 'Tasks',
    path: '/dashboard/tasks',
    icon: <TasksIcon />,
    roles: ['user', 'admin'],
    component: lazy(() => import('../pages/TasksPage')),
  },
  products: {
    title: 'Products',
    path: '/dashboard/products',
    icon: <ProductsIcon />,
    roles: ['admin'],
    component: lazy(() => import('../pages/ProductsPage')),
  }
};