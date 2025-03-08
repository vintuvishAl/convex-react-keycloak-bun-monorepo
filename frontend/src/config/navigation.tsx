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
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 7 4.5-2.5 4.5 2.5 4.5-2.5 4.5 2.5V17l-4.5 2.5-4.5-2.5-4.5 2.5L2 17V7z"/><path d="M11 9.5v5"/><path d="M6.5 7v5"/><path d="M16 7v5.5"/></svg>
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
  }
};