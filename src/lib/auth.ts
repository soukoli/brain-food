import NextAuth from "next-auth";
import { getDbAsync } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";
import authConfig from "./auth.config";

// Note: No database adapter - using pure JWT strategy for Edge compatibility
// User data is stored in the JWT token, not in database sessions
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, profile }) {
      // Create user in database on first sign-in
      if (user.id && user.email) {
        try {
          const db = await getDbAsync();

          // Check if user exists
          const existingUser = await db.query.users.findFirst({
            where: eq(users.id, user.id),
          });

          if (!existingUser) {
            // Create new user
            await db.insert(users).values({
              id: user.id,
              name: user.name || profile?.name || null,
              email: user.email,
              image: user.image || (profile as { picture?: string })?.picture || null,
            });
          }
        } catch (error) {
          console.error("Error creating user:", error);
          // Don't block sign-in on database errors
        }
      }
      return true;
    },
    async jwt({ token, user, profile }) {
      // On sign-in, persist user info into the token
      if (user) {
        token.id = user.id;
      }
      // Also capture from Google profile if available
      if (profile?.sub && !token.id) {
        token.id = profile.sub;
      }
      return token;
    },
    async session({ session, token }) {
      // Pass user.id from token to session
      if (session.user) {
        session.user.id = (token.id as string) || (token.sub as string) || "";
      }
      return session;
    },
  },
});

// Extend the session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
