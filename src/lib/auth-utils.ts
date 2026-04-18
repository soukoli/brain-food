import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDbAsync } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Ensure user exists in database, create if not.
 *
 * IMPORTANT: We lookup by EMAIL, not by OAuth ID.
 * OAuth providers may return different IDs across sessions/devices,
 * but email is stable and unique per user.
 *
 * Returns the database user ID (which may differ from OAuth ID).
 */
export async function ensureUserInDb(user: {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}): Promise<string> {
  const db = await getDbAsync();

  // Email is required for proper user identification
  if (!user.email) {
    throw new Error("User email is required for authentication");
  }

  // First, try to find existing user by EMAIL (stable identifier)
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, user.email),
  });

  if (existingUser) {
    // User exists - update their info if changed (name, image)
    if (existingUser.name !== user.name || existingUser.image !== user.image) {
      await db
        .update(users)
        .set({
          name: user.name || existingUser.name,
          image: user.image || existingUser.image,
        })
        .where(eq(users.id, existingUser.id));
    }
    return existingUser.id;
  }

  // New user - create with the OAuth ID as their database ID
  await db.insert(users).values({
    id: user.id,
    name: user.name || null,
    email: user.email,
    image: user.image || null,
  });

  return user.id;
}

/**
 * Get the database user ID for a session user.
 * Looks up user by email to ensure consistent ID across devices.
 */
async function getDbUserId(sessionUser: {
  id: string;
  email?: string | null;
}): Promise<string | null> {
  if (!sessionUser.email) return null;

  const db = await getDbAsync();
  const user = await db.query.users.findFirst({
    where: eq(users.email, sessionUser.email),
  });

  return user?.id ?? null;
}

/**
 * Get the currently authenticated user or redirect to login.
 * Returns user with stable database ID (not OAuth session ID).
 * Use this in Server Components that require authentication.
 */
export async function getRequiredUser() {
  const session = await auth();

  if (!session?.user?.id || !session.user.email) {
    redirect("/login");
  }

  // Get the stable database user ID
  const dbUserId = await getDbUserId(session.user);

  if (!dbUserId) {
    // User not in DB yet - this shouldn't happen if auth.ts works correctly
    // But handle gracefully by using session ID
    console.warn("User not found in DB, using session ID:", session.user.email);
  }

  return {
    ...session.user,
    id: dbUserId || session.user.id,
  };
}

/**
 * Get the current user ID or null if not authenticated
 * Use this when you need to check auth status without redirecting
 */
export async function getUserId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.email) return null;

  return await getDbUserId(session.user);
}

/**
 * Get the full session or null if not authenticated
 * Use this when you need access to the full session object
 */
export async function getSession() {
  return await auth();
}
