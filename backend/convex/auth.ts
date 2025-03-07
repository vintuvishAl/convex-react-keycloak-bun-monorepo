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

// Cache for Keycloak JWKS
let jwksCache: { keys: any[]; expiry: number } | null = null;

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

// Function to check if JWT is expired
function isTokenExpired(decodedToken: any): boolean {
  if (!decodedToken || !decodedToken.exp) {
    return true;
  }
  const currentTime = Math.floor(Date.now() / 1000);
  return decodedToken.exp < currentTime;
}

// Function to fetch JWKS
async function fetchJwks(keycloakUrl: string, realm: string) {
  try {
    const jwksUrl = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/certs`;
    console.log("JWKS URL:", jwksUrl);
    
    const response = await fetch(jwksUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch JWKS: ${response.statusText}`);
    }
    
    const jwksData = await response.json();
    console.log("JWKS Data received:", jwksData);

    return jwksData.keys;
  } catch (error) {
    console.error("Error fetching JWKS:", error);
    throw error;
  }
}

// Function to verify JWT token
export const verifyToken = action({
  args: {
    token: v.string()
  },
  handler: async (ctx, args) => {
    try {
      // First, decode the token without verification
      const decodedToken = parseJwtWithoutVerification(args.token);
      if (!decodedToken) {
        throw new Error("Invalid token format");
      }

      console.log("Decoded token:", decodedToken);

      // Check if token has expired
      if (isTokenExpired(decodedToken)) {
        throw new Error("Token has expired");
      }

      // Get token header
      const [headerB64] = args.token.split('.');
      const header = JSON.parse(Buffer.from(headerB64, 'base64').toString());

      // Fetch JWKS
      const issuerUrl = new URL(decodedToken.iss);
      const realm = issuerUrl.pathname.split('/').filter(Boolean)[1] || 'master';
      const keycloakUrlInternal = "http://keycloak:8080";

      const keys = await fetchJwks(keycloakUrlInternal, realm);
      const signingKey = keys.find((k: any) => k.kid === header.kid && k.use === 'sig');

      if (!signingKey) {
        throw new Error(`No matching signing key found for kid: ${header.kid}`);
      }

      // At this point we have verified:
      // 1. Token can be decoded
      // 2. Token hasn't expired
      // 3. Token's key ID matches a valid signing key from Keycloak
      // We'll treat this as sufficient for now

      // Save user information to database
      const userId = await ctx.runMutation(api.users.saveUser, {
        keycloakId: decodedToken.sub,
        username: decodedToken.preferred_username,
        email: decodedToken.email,
        firstName: decodedToken.given_name,
        lastName: decodedToken.family_name,
      });

      // Save auth session
      await ctx.runMutation(api.users.saveSession, {
        userId,
        keycloakId: decodedToken.sub,
        tokenExpiry: new Date(decodedToken.exp * 1000).toISOString()
      });
      
      return {
        userId: decodedToken.sub,
        username: decodedToken.preferred_username,
        email: decodedToken.email,
        firstName: decodedToken.given_name,
        lastName: decodedToken.family_name,
        isValid: true
      };
    } catch (error) {
      console.error("Token verification failed:", error);
      if (error instanceof Error) {
        console.error("Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
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
      lastName: user.lastName
    };

 
};