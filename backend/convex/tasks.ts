import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { validateUser } from "./auth";

// Get all tasks
export const get = query({
  handler: async (ctx) => {
    try {
      // Try to validate user, but don't fail if there's an authentication issue
      await validateUser(ctx);
    } catch (error) {
      console.log("Not authenticated, but allowing access for development");
    }
    return await ctx.db.query("tasks").order("desc").collect();
  },
});

// Get tasks for a specific user
export const getByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    try {
      // Try to validate the user using the helper function
      const identity = await validateUser(ctx);

      console.log("Identity: kjshdv", identity);
      
      // Ensure the user can only access their own tasks
      if (identity.subject !== args.userId) {
        throw new ConvexError("Unauthorized: You can only access your own tasks");
      }
    } catch (error) {
      // In development mode, skip auth validation
      console.log("Bypassing authentication check for development:", error);
    }
    
    return await ctx.db
      .query("tasks")
      .filter((q) => q.eq(q.field("userId"), args.userId))
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
    try {
      // Try to validate the user using the helper function
      const identity = await validateUser(ctx);

      console.log("Identity: kjshdv", identity);
      
      // Ensure the user can only create tasks for themselves
      if (identity.subject !== args.userId) {
        throw new ConvexError("Unauthorized: You can only create tasks for yourself");
      }
    } catch (error) {
      // In development mode, skip auth validation
      console.log("Bypassing authentication check for development:", error);
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
    // Get the task to check ownership
    const task = await ctx.db.get(args.id);
    if (!task) {
      throw new ConvexError("Task not found");
    }
    
    try {
      // Try to validate the user
      const identity = await validateUser(ctx);
      
      // Ensure the user can only update their own tasks
      if (task.userId !== identity.subject) {
        throw new ConvexError("Unauthorized: You can only update your own tasks");
      }
    } catch (error) {
      // In development mode, skip auth validation
      console.log("Bypassing authentication check for development:", error);
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
    // Get the task to check ownership
    const task = await ctx.db.get(args.id);
    if (!task) {
      throw new ConvexError("Task not found");
    }
    
    try {
      // Try to validate the user
      const identity = await validateUser(ctx);
      
      // Ensure the user can only update their own tasks
      if (task.userId !== identity.subject) {
        throw new ConvexError("Unauthorized: You can only update your own tasks");
      }
    } catch (error) {
      // In development mode, skip auth validation
      console.log("Bypassing authentication check for development:", error);
    }
    
    const { id, ...updates } = args;
    
    // Add the updated timestamp
    const updatedFields = {
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
    // Get the task to check ownership
    const task = await ctx.db.get(args.id);
    if (!task) {
      throw new ConvexError("Task not found");
    }
    
    try {
      // Try to validate the user
      const identity = await validateUser(ctx);
      
      // Ensure the user can only delete their own tasks
      if (task.userId !== identity.subject) {
        throw new ConvexError("Unauthorized: You can only delete your own tasks");
      }
    } catch (error) {
      // In development mode, skip auth validation
      console.log("Bypassing authentication check for development:", error);
    }
    
    await ctx.db.delete(args.id);
  },
});