import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { KeycloakProvider, createKeycloakConfig } from '@/KeycloakProvider';
import { ConvexProvider } from 'convex/react';
import { convex } from '@/convex';
import { ThemeProvider } from '@/ThemeProvider';

// Layout
import Header from '@/components/layout/Header';
import PrivateRoute from '@/components/layout/PrivateRoute';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import DynamicFormExample from '@/pages/DynamicFormExample';
import TasksPage from '@/pages/TasksPage';

const BaseLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col">
    <Header />
    <main className="flex-grow bg-background">
      {children}
    </main>
    <footer className="bg-secondary text-secondary-foreground p-4 text-center text-sm">
      <p>&copy; {new Date().getFullYear()} Convex + Keycloak Demo</p>
    </footer>
  </div>
);

function App() {
  const keycloakConfig = createKeycloakConfig();

  return (
    <BrowserRouter>
      <ThemeProvider>
        <ConvexProvider client={convex}>
          <KeycloakProvider config={keycloakConfig}>
            <BaseLayout>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                
                {/* Private routes */}
                <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
                <Route path="/tasks" element={<PrivateRoute><TasksPage /></PrivateRoute>} />
                
                {/* Fallback route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BaseLayout>
          </KeycloakProvider>
        </ConvexProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
