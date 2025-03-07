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
  
  // Products table
  products: defineTable({
    name: v.string(),
    description: v.string(),
    price: v.number(),
    category: v.string(),
    stockQuantity: v.number(),
    imageUrl: v.optional(v.string()),
    userId: v.string(), // Creator/owner of the product
    isActive: v.boolean(),
    createdAt: v.string(),
    updatedAt: v.optional(v.string()),
  }).index("by_category", ["category"])
    .index("by_user_id", ["userId"]),
  
  // Users table for storing user information from Keycloak
  users: defineTable({
    keycloakId: v.string(),
    username: v.string(),
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    lastLogin: v.string(),
    roles: v.optional(v.array(v.string())),
    realm_access: v.optional(v.object({
      roles: v.array(v.string())
    })),
    resource_access: v.optional(v.any()),
    isEmailVerified: v.optional(v.boolean()),
    attributes: v.optional(v.any()),
    lastTokenRefresh: v.optional(v.string()),
    sessionState: v.optional(v.string()),
    tokenId: v.optional(v.string()),
    lastTokenIat: v.optional(v.number())
  }).index("by_keycloak_id", ["keycloakId"])
    .index("by_role", ["roles"])
    .index("by_token_id", ["tokenId"]),
  
  // Auth sessions table to track active sessions
  authSessions: defineTable({
    userId: v.id("users"),
    keycloakId: v.string(),
    tokenExpiry: v.string(),
    lastActive: v.string(),
    // New security fields
    sessionState: v.optional(v.string()),
    tokenId: v.optional(v.string()),
  }).index("by_user_id", ["userId"])
    .index("by_token_id", ["tokenId"]), // New index for token tracking
});