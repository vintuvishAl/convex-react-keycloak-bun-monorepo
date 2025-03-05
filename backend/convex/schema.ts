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
  
  // Schema requests table - for tracking schema generation requests
  schemaRequests: defineTable({
    entityName: v.string(),
    description: v.optional(v.string()),
    fields: v.array(
      v.object({
        name: v.string(),
        type: v.string(),
        required: v.boolean(),
      })
    ),
    status: v.string(), // 'pending', 'completed', 'failed'
    userId: v.string(),
    requestDate: v.string(),
    completedDate: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
});