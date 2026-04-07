import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";

/**
 * Edge-compatible auth config (no database adapter)
 * Used by middleware for session checks
 */
export default {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          // Request offline access to get refresh token
          access_type: "offline",
          prompt: "consent",
          // Request Google Drive appdata scope for backup storage
          // This only allows access to app-specific folder, not user's files
          scope: "openid email profile https://www.googleapis.com/auth/drive.appdata",
        },
      },
    }),
    // Development-only credentials provider for testing
    ...(process.env.NODE_ENV === "development"
      ? [
          Credentials({
            name: "Test Account",
            credentials: {
              email: { label: "Email", type: "email" },
            },
            async authorize(credentials) {
              if (credentials?.email === "test@example.com") {
                return {
                  id: "test-user-123",
                  name: "Test User",
                  email: "test@example.com",
                };
              }
              return null;
            },
          }),
        ]
      : []),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  trustHost: true,
} satisfies NextAuthConfig;
