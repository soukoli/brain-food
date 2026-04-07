import NextAuth from "next-auth";
import authConfig from "./auth.config";

// Note: No database adapter - using pure JWT strategy for Edge compatibility
// User data is stored in the JWT token, not in database sessions
// User creation in DB is handled by ensureUserInDb() in auth-utils.ts
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, profile }) {
      // On sign-in, persist user info into the token
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.image = user.image;
      }
      // Also capture from Google profile if available
      if (profile?.sub && !token.id) {
        token.id = profile.sub;
        token.name = profile.name;
        token.email = profile.email;
        token.image = (profile as { picture?: string })?.picture;
      }
      return token;
    },
    async session({ session, token }) {
      // Pass user info from token to session
      if (session.user) {
        session.user.id = (token.id as string) || (token.sub as string) || "";
        if (token.name) session.user.name = token.name as string;
        if (token.email) session.user.email = token.email as string;
        if (token.image) session.user.image = token.image as string;
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
