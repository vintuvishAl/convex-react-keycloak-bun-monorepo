import { ConvexReactClient } from "convex/react";
import { Id } from "../../backend/convex/_generated/dataModel";

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
    return null;
  }
  
  try {
    // Update the token if needed (this will refresh if it's close to expiring)
    const updated = await keycloak.updateToken(30);
    if (updated) {
      console.log("Token was successfully updated");
    }
    
    return keycloak.token as string;
  } catch (error) {
    console.error("Failed to update token", error);
    return null;
  }
};

// Apply the authenticator
convex.setAuth(() => keycloakAuthenticator());

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
}

export const api = {
  tasks: {
    getByUser: "tasks:getByUser",
    add: "tasks:add",
    update: "tasks:update",
    toggleCompleted: "tasks:toggleCompleted",
    remove: "tasks:remove",
  },
} as const;