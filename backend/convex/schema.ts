import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Define your Convex database schema
export default defineSchema({
  // Chat messages table
  chats: defineTable({
    content: v.string(),
    userId: v.string(),
    userName: v.string(),
    timestamp: v.string(),
    isAiMessage: v.boolean(),
    promptId: v.optional(v.id("messages")),
  }),
  
  // Tasks table
  tasks: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    completed: v.boolean(),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    dueDate: v.optional(v.string()),
    userId: v.string(),
    createdAt: v.string(),
    updatedAt: v.optional(v.string()),
  }),
  
  // Users table for storing user information from Keycloak
  users: defineTable({
    keycloakId: v.string(),
    username: v.string(),
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    lastLogin: v.string(),
  }).index("by_keycloak_id", ["keycloakId"]),
  
  // Auth sessions table to track active sessions
  authSessions: defineTable({
    userId: v.id("users"),
    keycloakId: v.string(),
    tokenExpiry: v.string(),
    lastActive: v.string(),
  }).index("by_user_id", ["userId"])
});