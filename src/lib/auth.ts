import NextAuth from "next-auth";
import authConfig from "./auth.config";
import { getDbAsync } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Get or create user in database by email.
 * Returns the stable database user ID.
 */
async function getOrCreateUser(profile: {
  id?: string;
  sub?: string;
  name?: string;
  email?: string;
  image?: string;
  picture?: string;
}): Promise<string | null> {
  const email = profile.email;
  if (!email) return null;

  try {
    const db = await getDbAsync();

    // Find existing user by email
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      // Update profile info if changed
      const newName = profile.name || existingUser.name;
      const newImage = profile.picture || profile.image || existingUser.image;

      if (existingUser.name !== newName || existingUser.image !== newImage) {
        await db
          .update(users)
          .set({ name: newName, image: newImage })
          .where(eq(users.id, existingUser.id));
      }
      return existingUser.id;
    }

    // Create new user
    const newId = profile.sub || profile.id || crypto.randomUUID();
    await db.insert(users).values({
      id: newId,
      name: profile.name || null,
      email: email,
      image: profile.picture || profile.image || null,
    });

    return newId;
  } catch (error) {
    console.error("Error in getOrCreateUser:", error);
    return null;
  }
}

// Note: No database adapter - using pure JWT strategy for Edge compatibility
// User data is stored in the JWT token, not in database sessions
// User creation in DB is handled during JWT callback
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, profile, account }) {
      // On initial sign-in, get/create user in DB and use DB user ID
      if (account && profile) {
        const dbUserId = await getOrCreateUser({
          id: user?.id,
          sub: profile.sub ?? undefined,
          name: (profile.name ?? user?.name) || undefined,
          email: (profile.email ?? user?.email) || undefined,
          image: user?.image || undefined,
          picture: (profile as { picture?: string })?.picture,
        });

        if (dbUserId) {
          token.id = dbUserId; // Use stable DB user ID
          token.name = profile.name ?? user?.name;
          token.email = profile.email ?? user?.email;
          token.image = (profile as { picture?: string })?.picture ?? user?.image;
        }
      }

      // Capture Google OAuth tokens for Google Drive access
      if (account?.provider === "google") {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpires = account.expires_at ? account.expires_at * 1000 : 0;
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

      // Pass tokens to session for Google Drive API access
      session.accessToken = token.accessToken as string | undefined;
      session.refreshToken = token.refreshToken as string | undefined;
      session.accessTokenExpires = token.accessTokenExpires as number | undefined;

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
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
  }
}
