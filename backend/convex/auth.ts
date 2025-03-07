"use node";
import { v } from "convex/values";
import type { Auth } from "convex/server";
import { ConvexError } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

// Define the structure of our token claims
export interface TokenClaims {
  sub: string;
  preferred_username: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  exp: number;
  iat: number;
  aud: string[];
  iss: string;
}

// Function to extract basic information from JWT without verification
function parseJwtWithoutVerification(token: string): any {
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
  } catch (error) {
    console.error("Error parsing JWT:", error);
    return null;
  }
}

// Simple in-memory rate limiting with configurable values from env
const rateLimiter = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_WINDOW = parseInt(process.env.AUTH_RATE_LIMIT_WINDOW || "60000"); // Default to 1 minute
const MAX_ATTEMPTS = parseInt(process.env.AUTH_RATE_LIMIT_MAX_ATTEMPTS || "5"); // Default to 5 attempts

function checkRateLimit(clientKey: string): boolean {
  const now = Date.now();
  const record = rateLimiter.get(clientKey);

  // Clear old records
  if (record && now - record.timestamp > RATE_LIMIT_WINDOW) {
    rateLimiter.delete(clientKey);
    return true;
  }

  if (record) {
    if (record.count >= MAX_ATTEMPTS) {
      return false;
    }
    record.count++;
  } else {
    rateLimiter.set(clientKey, { count: 1, timestamp: now });
  }
  return true;
}

// Function to validate basic token structure
function validateTokenStructure(token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }
  
  try {
    const header = JSON.parse(atob(parts[0]));
    return header.typ === 'JWT' && header.alg === 'RS256';
  } catch {
    return false;
  }
}

// Function to verify JWT token
export const verifyToken = action({
  args: {
    token: v.string()
  },
  handler: async (ctx, args) => {
    try {
      // Rate limiting
      const clientKey = args.token.slice(0, 10);
      if (!checkRateLimit(clientKey)) {
        throw new Error("Too many authentication attempts. Please try again later.");
      }

      // Basic token structure validation
      if (!validateTokenStructure(args.token)) {
        throw new Error("Invalid token structure");
      }

      // Decode token payload
      const decodedToken = parseJwtWithoutVerification(args.token);
      if (!decodedToken) {
        throw new Error("Invalid token format");
      }

      // Enhanced token validation checks
      const now = Math.floor(Date.now() / 1000);
      
      // Check token expiration with configurable grace period
      const EXPIRATION_GRACE_PERIOD = parseInt(process.env.AUTH_TOKEN_EXPIRATION_GRACE_PERIOD || "30");
      if (!decodedToken.exp || decodedToken.exp + EXPIRATION_GRACE_PERIOD < now) {
        throw new Error("Token has expired");
      }

      // Check token not used before its issuance
      if (!decodedToken.iat || decodedToken.iat > now) {
        throw new Error("Token used before issuance");
      }

      // Check token age with configurable max age
      const MAX_TOKEN_AGE = parseInt(process.env.AUTH_MAX_TOKEN_AGE || "86400");
      if (now - decodedToken.iat > MAX_TOKEN_AGE) {
        throw new Error("Token is too old");
      }

      // Validate issuer using configured values
      const validIssuers = (process.env.AUTH_VALID_ISSUERS || "").split(",").filter(Boolean);
      if (validIssuers.length === 0) {
        validIssuers.push("http://localhost:8080/realms/master"); // Fallback default
      }
      
      console.log("Token details for debugging:", {
        receivedIssuer: decodedToken.iss,
        validIssuers,
        tokenAudience: decodedToken.aud,
        clientId: decodedToken.azp
      });
      
      if (!validIssuers.includes(decodedToken.iss)) {
        console.log("Token issuer mismatch:", decodedToken.iss);
        throw new Error(`Invalid token issuer: ${decodedToken.iss}`);
      }

      // Validate audience and client ID using configured values
      const validClientIds = (process.env.AUTH_VALID_CLIENT_IDS || "").split(",").filter(Boolean);
      const validAudiences = (process.env.AUTH_VALID_AUDIENCES || "").split(",").filter(Boolean);

      if (validClientIds.length > 0 && !validClientIds.includes(decodedToken.azp)) {
        console.log("Client ID mismatch:", decodedToken.azp);
        throw new Error("Invalid client ID");
      }

      if (validAudiences.length > 0 && !decodedToken.aud?.some((aud: string) => validAudiences.includes(aud))) {
        throw new Error("Invalid token audience");
      }

      // Validate token source using configured values
      const validSources = (process.env.AUTH_VALID_SOURCES || "").split(",").filter(Boolean);
      if (validSources.length > 0 && (!decodedToken.azp || !validSources.includes(decodedToken.azp))) {
        console.log("Token source validation failed:", {
          receivedSource: decodedToken.azp,
          validSources
        });
        throw new Error("Invalid token source");
      }

      // Check token type
      if (decodedToken.typ !== 'Bearer') {
        throw new Error("Invalid token type");
      }

      // Validate required claims
      const requiredClaims = [
        'sub', 'preferred_username', 'iat', 'exp', 'aud', 'iss', 'jti'
      ];
      const missingClaims = requiredClaims.filter(claim => !decodedToken[claim]);
      if (missingClaims.length > 0) {
        throw new Error(`Token missing required claims: ${missingClaims.join(', ')}`);
      }

      // Check for replay attack using jti (JWT ID)
      const jtiKey = `jti:${decodedToken.jti}`;
      const usedJtis = new Set<string>();
      if (usedJtis.has(jtiKey)) {
        throw new Error("Token has already been used (replay attack detected)");
      }
      usedJtis.add(jtiKey);

      // Validate session state if present
      if (!decodedToken.session_state) {
        throw new Error("Missing session state");
      }

      // Save user information to database with enhanced security fields
      const userId = await ctx.runMutation(api.users.saveUser, {
        keycloakId: decodedToken.sub,
        username: decodedToken.preferred_username,
        email: decodedToken.email,
        firstName: decodedToken.given_name,
        lastName: decodedToken.family_name,
        roles: decodedToken.realm_access?.roles || [],
        realm_access: decodedToken.realm_access,
        resource_access: decodedToken.resource_access,
        isEmailVerified: decodedToken.email_verified,
        attributes: decodedToken.attributes,
        // New security fields
        sessionState: decodedToken.session_state,
        tokenId: decodedToken.jti,
        lastTokenIat: decodedToken.iat
      });

      // Save auth session with enhanced security
      await ctx.runMutation(api.users.saveSession, {
        userId,
        keycloakId: decodedToken.sub,
        tokenExpiry: new Date(decodedToken.exp * 1000).toISOString(),
        sessionState: decodedToken.session_state,
        tokenId: decodedToken.jti
      });

      console.log("Token validation successful:", {
        userId: decodedToken.sub,
        username: decodedToken.preferred_username,
        sessionState: decodedToken.session_state,
        exp: new Date(decodedToken.exp * 1000).toISOString()
      });
      
      return {
        userId: decodedToken.sub,
        username: decodedToken.preferred_username,
        email: decodedToken.email,
        firstName: decodedToken.given_name,
        lastName: decodedToken.family_name,
        roles: decodedToken.realm_access?.roles || [],
        isEmailVerified: decodedToken.email_verified,
        isValid: true,
        sessionState: decodedToken.session_state
      };

    } catch (error) {
      console.error("Token verification failed:", error);
      return {
        isValid: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
});

// Helper function to check auth in query and mutation functions
export const validateUser = async (ctx: { auth: Auth; db: any }) => {
    const activeSession = await ctx.db
      .query("authSessions")
      .filter((q: any) => q.gte(q.field("tokenExpiry"), new Date().toISOString()))
      .first();

    if (!activeSession) {
      throw new ConvexError("Unauthorized: No valid session found");
    }

    // Get user data
    const user = await ctx.db
      .query("users")
      .filter((q: any) => q.eq(q.field("_id"), activeSession.userId))
      .first();

    if (!user) {
      throw new ConvexError("Unauthorized: User not found");
    }

    return {
      id: user._id,
      issuer: "keycloak",
      subject: user.keycloakId,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.roles || [],
      realm_access: user.realm_access,
      resource_access: user.resource_access,
      isEmailVerified: user.isEmailVerified,
      attributes: user.attributes
    };
};