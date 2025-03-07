import { query } from "./_generated/server";
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { DatabaseWriter } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Query to get user information
export const getUser = query({
  args: { keycloakId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_keycloak_id", (q) => q.eq("keycloakId", args.keycloakId))
      .first();
  },
});

// Query to get user's current session
export const getUserSession = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("authSessions")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();
  },
});



// Helper function to save or update user in the database
async function saveUserToDatabase(db: DatabaseWriter, userData: {
  keycloakId: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}): Promise<Id<"users">> {
  // Check if user already exists
  const existingUser = await db
    .query("users")
    .withIndex("by_keycloak_id", (q: any) => q.eq("keycloakId", userData.keycloakId))
    .first();

  if (existingUser) {
    // Update existing user
    await db.patch(existingUser._id, {
      username: userData.username,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      lastLogin: new Date().toISOString(),
    });
    return existingUser._id;
  } else {
    // Create new user
    return await db.insert("users", {
      keycloakId: userData.keycloakId,
      username: userData.username,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      lastLogin: new Date().toISOString(),
    });
  }
}

// Helper function to save auth session
async function saveAuthSession(
  db: DatabaseWriter,
  userId: Id<"users">,
  keycloakId: string,
  tokenExpiry: string
): Promise<Id<"authSessions">> {
  // Delete any existing sessions for this user
  const existingSessions = await db
    .query("authSessions")
    .withIndex("by_user_id", (q: any) => q.eq("userId", userId))
    .collect();
    
  for (const session of existingSessions) {
    await db.delete(session._id);
  }

  // Create new session
  return await db.insert("authSessions", {
    userId,
    keycloakId,
    tokenExpiry,
    lastActive: new Date().toISOString(),
  });
}

// Mutation to save or update user
export const saveUser = mutation({
  args: {
    keycloakId: v.string(),
    username: v.string(),
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    return await saveUserToDatabase(ctx.db, args);
  }
});

// Mutation to save auth session
export const saveSession = mutation({
  args: {
    userId: v.id("users"),
    keycloakId: v.string(),
    tokenExpiry: v.string()
  },
  handler: async (ctx, args) => {
    return await saveAuthSession(ctx.db, args.userId, args.keycloakId, args.tokenExpiry);
  }
});