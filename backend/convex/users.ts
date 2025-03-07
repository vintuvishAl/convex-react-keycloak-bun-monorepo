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

// Query to get user by role
export const getUsersByRole = query({
  args: { role: v.string() },
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query("users")
      .collect();
    return users.filter(user => user.roles?.includes(args.role));
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
  roles?: string[];
  realm_access?: { roles: string[] };
  resource_access?: any;
  isEmailVerified?: boolean;
  attributes?: any;
  sessionState?: string;
  tokenId?: string;
  lastTokenIat?: number;
}): Promise<Id<"users">> {
  // Check if user already exists
  const existingUser = await db
    .query("users")
    .withIndex("by_keycloak_id", (q: any) => q.eq("keycloakId", userData.keycloakId))
    .first();

  const now = new Date().toISOString();
  const userFields = {
    username: userData.username,
    email: userData.email,
    firstName: userData.firstName,
    lastName: userData.lastName,
    lastLogin: now,
    roles: userData.roles,
    realm_access: userData.realm_access,
    resource_access: userData.resource_access,
    isEmailVerified: userData.isEmailVerified,
    attributes: userData.attributes,
    lastTokenRefresh: now,
    // Add new security fields
    sessionState: userData.sessionState,
    tokenId: userData.tokenId,
    lastTokenIat: userData.lastTokenIat
  };

  if (existingUser) {
    // Update existing user
    await db.patch(existingUser._id, userFields);
    return existingUser._id;
  } else {
    // Create new user
    return await db.insert("users", {
      keycloakId: userData.keycloakId,
      ...userFields
    });
  }
}

// Enhanced saveAuthSession with additional security checks
async function saveAuthSession(
  db: DatabaseWriter,
  userId: Id<"users">,
  keycloakId: string,
  tokenExpiry: string,
  sessionState?: string,
  tokenId?: string
): Promise<Id<"authSessions">> {
  const MAX_SESSIONS_PER_USER = 5;
  const now = new Date().toISOString();
  
  // Get active sessions
  const activeSessions = await db
    .query("authSessions")
    .withIndex("by_user_id", (q) => q.eq("userId", userId))
    .filter((q) => q.gte(q.field("tokenExpiry"), now))
    .collect();

  // If max sessions reached, revoke oldest session
  if (activeSessions.length >= MAX_SESSIONS_PER_USER) {
    const oldestSession = activeSessions
      .sort((a, b) => a.lastActive.localeCompare(b.lastActive))[0];
    await db.delete(oldestSession._id);
  }

  // Create new session with strict timeout
  const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours
  const sessionExpiry = new Date(Date.now() + SESSION_DURATION).toISOString();
  const actualExpiry = new Date(tokenExpiry).getTime() < Date.now() + SESSION_DURATION
    ? tokenExpiry // Use token expiry if it's sooner
    : sessionExpiry; // Use session timeout otherwise

  return await db.insert("authSessions", {
    userId,
    keycloakId,
    tokenExpiry: actualExpiry,
    lastActive: now,
    sessionState,
    tokenId
  });
}

// Mutation to save or update user
export const saveUser = mutation({
  args: {
    keycloakId: v.string(),
    username: v.string(),
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    roles: v.optional(v.array(v.string())),
    realm_access: v.optional(v.object({
      roles: v.array(v.string())
    })),
    resource_access: v.optional(v.any()),
    isEmailVerified: v.optional(v.boolean()),
    attributes: v.optional(v.any()),
    // Add new security fields to validation
    sessionState: v.optional(v.string()),
    tokenId: v.optional(v.string()),
    lastTokenIat: v.optional(v.number())
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
    tokenExpiry: v.string(),
    sessionState: v.optional(v.string()),
    tokenId: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    return await saveAuthSession(
      ctx.db, 
      args.userId, 
      args.keycloakId, 
      args.tokenExpiry,
      args.sessionState,
      args.tokenId
    );
  }
});

// Check if user has a specific role
export const hasRole = query({
  args: { 
    keycloakId: v.string(),
    role: v.string()
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_keycloak_id", (q) => q.eq("keycloakId", args.keycloakId))
      .first();
    
    if (!user || !user.roles) {
      return false;
    }
    
    return user.roles.includes(args.role);
  }
});

// Update user roles
export const updateUserRoles = mutation({
  args: {
    userId: v.id("users"),
    roles: v.array(v.string())
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      roles: args.roles,
      lastTokenRefresh: new Date().toISOString()
    });
    return args.userId;
  }
});

// Add session management functions
export const revokeAllUserSessions = mutation({
  args: {
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("authSessions")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();
    
    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }
  }
});

export const revokeSession = mutation({
  args: {
    sessionId: v.id("authSessions")
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.sessionId);
  }
});

export const getActiveSessions = query({
  args: {
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    return await ctx.db
      .query("authSessions")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .filter((q) => q.gte(q.field("tokenExpiry"), now))
      .collect();
  }
});