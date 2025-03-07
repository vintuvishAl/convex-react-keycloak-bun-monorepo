import { ConvexReactClient } from "convex/react";
import { Id } from "../../backend/convex/_generated/dataModel";
import { api } from "@backend/convex/_generated/api";

export type TaskId = Id<"tasks">;

export interface Task {
  _id: TaskId;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: string;
  priority?: "low" | "medium" | "high";
  userId: string;
  createdAt: string;
  updatedAt?: string;
}

// Create a singleton client with connection retry
const convexUrl = 'http://localhost:3210';
const client = new ConvexReactClient(convexUrl, {
  unsavedChangesWarning: false // Disable unsaved changes warning
});

// Export the singleton instance
export const convex = client;

// Helper function for retry logic
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  throw lastError;
}

// Create a custom authenticator to pass Keycloak tokens to Convex with enhanced security
export const keycloakAuthenticator = async () => {
  // Wait for window.keycloakInstance to be available
  let attempts = 0;
  const maxAttempts = 10;
  const delay = 500;

  while (attempts < maxAttempts) {
    const keycloak = (window as any).keycloakInstance;
    if (keycloak?.authenticated) {
      try {
        // Check if token is close to expiry
        const tokenExpiry = keycloak.tokenParsed?.exp ?? 0;
        const now = Math.floor(Date.now() / 1000);
        const timeToExpiry = tokenExpiry - now;
        
        // Update token if it expires in less than 2 minutes
        if (timeToExpiry < 120) {
          console.log("Token near expiry, refreshing...");
          const updated = await keycloak.updateToken(120);
          if (updated) {
            console.log("Token refreshed successfully");
          }
        }
        
        const token = keycloak.token;
        if (!token) {
          throw new Error("No token available");
        }

        // Basic token validation
        const parts = token.split('.');
        if (parts.length !== 3) {
          throw new Error("Invalid token format");
        }

        const payload = JSON.parse(atob(parts[1]));
        if (!payload.sub || !payload.exp || payload.exp < now) {
          throw new Error("Token validation failed");
        }

        return token;
      } catch (error) {
        console.error("Token validation error:", error);
        if (attempts === maxAttempts - 1) {
          await handleAuthError();
        }
      }
    }

    console.log(`Waiting for Keycloak (attempt ${attempts + 1}/${maxAttempts})...`);
    await new Promise(resolve => setTimeout(resolve, delay));
    attempts++;
  }

  console.log("No Keycloak instance or not authenticated after retries");
  return null;
};

// Helper function to handle authentication errors
async function handleAuthError() {
  const keycloak = (window as any).keycloakInstance;
  if (keycloak) {
    sessionStorage.clear();
    try {
      console.log("Logging out due to auth error...");
      await keycloak.logout({
        redirectUri: window.location.origin + '/login'
      });
    } catch (error) {
      console.error("Logout failed:", error);
      window.location.href = '/login';
    }
  }
}

// Apply the authenticator with retry logic
convex.setAuth(async () => {
  try {
    return await withRetry(keycloakAuthenticator, 3, 1000);
  } catch (error) {
    console.error("Auth error after retries:", error);
    await handleAuthError();
    return null;
  }
});

// Define our API interface
export interface ConvexAPI {
  tasks: {
    getByUser: (args: { userId: string }) => Promise<Task[]>;
    add: (args: {
      title: string;
      description?: string;
      completed: boolean;
      userId: string;
      dueDate?: string;
      priority?: "low" | "medium" | "high";
    }) => Promise<TaskId>;
    update: (args: {
      id: TaskId;
      title?: string;
      description?: string;
      completed?: boolean;
      dueDate?: string;
      priority?: "low" | "medium" | "high";
    }) => Promise<void>;
    toggleCompleted: (args: { id: TaskId; completed: boolean }) => Promise<void>;
    remove: (args: { id: TaskId }) => Promise<void>;
  };
  auth: {
    verifyToken: (args: { token: string }) => Promise<{
      userId: string;
      username: string;
      email?: string;
      firstName?: string;
      lastName?: string;
      isValid: boolean;
      error?: string;
    }>;
  };
}

// Helper function to verify the token with enhanced error handling and retry
export const verifyToken = async (): Promise<boolean> => {
  const keycloak = (window as any).keycloakInstance;
  
  if (!keycloak?.authenticated || !keycloak.token) {
    return false;
  }
  
  try {
    const result = await withRetry(async () => {
      console.log("Verifying token...");
      return await convex.action(api.auth.verifyToken, { token: keycloak.token });
    }, 3, 1000);

    if (!result.isValid) {
      console.error("Token verification failed:", result.error);
      sessionStorage.clear();
    }

    return result.isValid;
  } catch (error) {
    console.error("Token verification request failed:", error);
    sessionStorage.clear();
    return false;
  }
}