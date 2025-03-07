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

const convexUrl = 'http://localhost:3210';

// Create a singleton client
const client = new ConvexReactClient(convexUrl);

// Export the singleton instance
export const convex = client;

// Create a custom authenticator to pass Keycloak tokens to Convex
export const keycloakAuthenticator = async () => {
  // Get Keycloak instance from window
  const keycloak = (window as any).keycloakInstance;
  
  if (!keycloak || !keycloak.authenticated) {
    console.log("No Keycloak instance or not authenticated");
    return null;
  }
  
  try {
    // Update the token if needed (this will refresh if it's close to expiring)
    const updated = await keycloak.updateToken(30);
    if (updated) {
      console.log("Token was successfully updated");
    }
    
    const token = keycloak.token;
    if (!token) {
      console.error("No token available from Keycloak");
      return null;
    }

    // Parse the token to get user information
    const tokenData = parseJwt(token);
    
    // Return the auth object in the format Convex expects
    return {
      tokenData,
      token,
      // These fields are required by Convex for authentication
      issuer: tokenData.iss,
      subject: tokenData.sub,
      tokenIdentifier: `${tokenData.iss}/${tokenData.sub}`,
    };
  } catch (error) {
    console.error("Failed to update/retrieve token:", error);
    return null;
  }
};

// Helper function to parse JWT without verification
function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Error parsing JWT token:", e);
    return {};
  }
}

// Apply the authenticator and ensure we handle the Promise correctly
convex.setAuth(keycloakAuthenticator);

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

// Helper function to verify the token with the backend
export const verifyToken = async (): Promise<boolean> => {
  const keycloak = (window as any).keycloakInstance;
  
  if (!keycloak || !keycloak.authenticated || !keycloak.token) {
    return false;
  }
  
  try {
    const result = await convex.action(api.auth.verifyToken, { token: keycloak.token });
    return result.isValid;
  } catch (error) {
    console.error("Token verification failed:", error);
    return false;
  }
}