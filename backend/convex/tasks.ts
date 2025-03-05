import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { validateUser } from "./auth";

// Get all tasks
export const get = query({
  handler: async (ctx) => {
    // Validate the user is authenticated
    await validateUser(ctx.auth);
    return await ctx.db.query("tasks").order("desc").collect();
  },
});

// Get tasks for a specific user
export const getByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // Validate the user is authenticated
    const identity = await validateUser(ctx.auth);
    
    // Optionally: Ensure the user can only access their own tasks
    if (identity.subject !== args.userId) {
      throw new Error("Unauthorized: You can only access your own tasks");
    }
    
    return await ctx.db
      .query("tasks")
      .filter(q => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .collect();
  },
});

// Add a new task
export const add = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    completed: v.boolean(),
    userId: v.string(),
    dueDate: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
  },
  handler: async (ctx, args) => {
    // Validate the user is authenticated
    const identity = await validateUser(ctx.auth);
    
    // Ensure the user can only create tasks for themselves
    if (identity.subject !== args.userId) {
      throw new Error("Unauthorized: You can only create tasks for yourself");
    }
    
    const taskId = await ctx.db.insert("tasks", {
      title: args.title,
      description: args.description,
      completed: args.completed,
      userId: args.userId,
      dueDate: args.dueDate,
      priority: args.priority,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return taskId;
  },
});

// Toggle task completion status
export const toggleCompleted = mutation({
  args: {
    id: v.id("tasks"),
    completed: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Validate the user is authenticated
    const identity = await validateUser(ctx.auth);
    
    // Get the task to check ownership
    const task = await ctx.db.get(args.id);
    if (!task) {
      throw new Error("Task not found");
    }
    
    // Ensure the user can only update their own tasks
    if (task.userId !== identity.subject) {
      throw new Error("Unauthorized: You can only update your own tasks");
    }
    
    await ctx.db.patch(args.id, {
      completed: args.completed,
      updatedAt: new Date().toISOString(),
    });
  },
});

// Update a task
export const update = mutation({
  args: {
    id: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    completed: v.optional(v.boolean()),
    dueDate: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
  },
  handler: async (ctx, args) => {
    // Validate the user is authenticated
    const identity = await validateUser(ctx.auth);
    
    // Get the task to check ownership
    const task = await ctx.db.get(args.id);
    if (!task) {
      throw new Error("Task not found");
    }
    
    // Ensure the user can only update their own tasks
    if (task.userId !== identity.subject) {
      throw new Error("Unauthorized: You can only update your own tasks");
    }
    
    const { id, ...updates } = args;
    
    // Add the updated timestamp
    const updatedFields: Partial<{ title?: string; description?: string; completed?: boolean; dueDate?: string; priority?: "low" | "medium" | "high"; updatedAt: string }> = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    await ctx.db.patch(id, updatedFields);
  },
});

// Delete a task
export const remove = mutation({
  args: {
    id: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    // Validate the user is authenticated
    const identity = await validateUser(ctx.auth);
    
    // Get the task to check ownership
    const task = await ctx.db.get(args.id);
    if (!task) {
      throw new Error("Task not found");
    }
    
    // Ensure the user can only delete their own tasks
    if (task.userId !== identity.subject) {
      throw new Error("Unauthorized: You can only delete your own tasks");
    }
    
    await ctx.db.delete(args.id);
  },
});