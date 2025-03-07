import { query } from "./_generated/server";
import { v } from "convex/values";

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