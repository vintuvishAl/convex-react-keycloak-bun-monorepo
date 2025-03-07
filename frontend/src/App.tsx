import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { KeycloakProvider, createKeycloakConfig } from "@/KeycloakProvider";
import { ConvexProvider } from "convex/react";
import { convex } from "@/convex";
import { ThemeProvider } from "@/ThemeProvider";
import { ConvexErrorBoundary } from './components/ConvexErrorBoundary';

// Layout
import Header from "@/components/layout/Header";
import PrivateRoute from "@/components/layout/PrivateRoute";

// Pages
import HomePage from "./pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import DashboardPage from "@/pages/DashboardPage";

const BaseLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col">
    <Header />
    <main className="flex-grow bg-background">{children}</main>
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
        <ConvexErrorBoundary>
          <KeycloakProvider config={keycloakConfig}>
            <ConvexProvider client={convex}>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<BaseLayout><HomePage /></BaseLayout>} />
                <Route path="/login" element={<BaseLayout><LoginPage /></BaseLayout>} />
                <Route path="/register" element={<BaseLayout><RegisterPage /></BaseLayout>} />
              
                {/* Private routes */}
                <Route
                  path="/dashboard"
                  element={
                    <PrivateRoute>
                      <DashboardPage />
                    </PrivateRoute>
                  }
                />

                {/* Fallback route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ConvexProvider>
          </KeycloakProvider>
        </ConvexErrorBoundary>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
