// auth.ts
"use node";
import { v } from "convex/values";
import type { Auth } from "convex/server";
import { ConvexError } from "convex/values";
import jwt from "jsonwebtoken";
import { internal } from "./_generated/api";
import { action } from "./_generated/server";
import fetch from "node-fetch";

// Define the structure of our token claims
export interface TokenClaims {
  sub: string;          // User ID
  preferred_username: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  exp: number;          // Expiration timestamp
  iat: number;          // Issued at timestamp
  aud: string;          // Audience
  iss: string;          // Issuer (Keycloak server URL)
}

// Cache for Keycloak public key
let publicKeyCache: { key: string; expiry: number } | null = null;

// Function to get Keycloak public key
async function getKeycloakPublicKey(keycloakUrl: string, realm: string) {
  // Check cache first
  if (publicKeyCache && publicKeyCache.expiry > Date.now()) {
    return publicKeyCache.key;
  }
  
  try {
    // Fetch the public key from Keycloak's JWKS endpoint
    const publicKeyUrl = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/certs`;
    const response = await fetch(publicKeyUrl);
    
    if (!response.ok) {
      throw new ConvexError(`Failed to fetch JWKS: ${response.statusText}`);
    }
    
    const jwks = await response.json();
    
    // Find the active signing key (usually the first one)
    if (!jwks.keys || jwks.keys.length === 0) {
      throw new ConvexError("No keys found in JWKS response");
    }
    
    // Get the first RSA key
    const key = jwks.keys.find((k: any) => k.use === 'sig' && k.kty === 'RSA');
    if (!key) {
      throw new ConvexError("No suitable signing key found in JWKS");
    }
    
    // Format the key for jwt verification
    const publicKey = {
      kty: key.kty,
      n: key.n,
      e: key.e,
      kid: key.kid,
      alg: key.alg
    };
    
    // Cache the key for 24 hours (or less if you want more frequent refreshes)
    publicKeyCache = {
      key: JSON.stringify(publicKey),
      expiry: Date.now() + 24 * 60 * 60 * 1000
    };
    
    return publicKeyCache.key;
  } catch (error) {
    console.error("Error fetching public key:", error);
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
      // Get environment variables with validation
      const keycloakUrl = process.env.KEYCLOAK_URL;
      if (!keycloakUrl) throw new ConvexError("KEYCLOAK_URL environment variable is missing");
      
      const realm = process.env.KEYCLOAK_REALM;
      if (!realm) throw new ConvexError("KEYCLOAK_REALM environment variable is missing");
      
      const clientId = process.env.KEYCLOAK_CLIENT_ID;
      if (!clientId) throw new ConvexError("KEYCLOAK_CLIENT_ID environment variable is missing");
      
      // First, decode without verification to get the kid (key id)
      const decoded = jwt.decode(args.token, { complete: true });
      if (!decoded || !decoded.header || !decoded.header.kid) {
        throw new ConvexError("Invalid token format");
      }
      
      // Get the public key
      const publicKey = await getKeycloakPublicKey(keycloakUrl, realm);
      
      // Verify the token
      const verifiedToken = jwt.verify(args.token, publicKey, {
        audience: clientId,
        issuer: `${keycloakUrl}/realms/${realm}`
      }) as TokenClaims;
      
      // Return the validated user info
      return {
        userId: verifiedToken.sub,
        username: verifiedToken.preferred_username,
        email: verifiedToken.email,
        firstName: verifiedToken.given_name,
        lastName: verifiedToken.family_name,
        isValid: true
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
export const validateUser = async (auth: Auth) => {
  const identity = await auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError("Unauthorized: User not authenticated");
  }
  return identity;
};