import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDbAsync } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Ensure user exists in database, create if not
 * Call this before any database operation that requires user_id foreign key
 */
export async function ensureUserInDb(user: {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}): Promise<void> {
  const db = await getDbAsync();

  const existingUser = await db.query.users.findFirst({
    where: eq(users.id, user.id),
  });

  if (!existingUser) {
    await db.insert(users).values({
      id: user.id,
      name: user.name || null,
      email: user.email || null,
      image: user.image || null,
    });
  }
}

/**
 * Get the currently authenticated user or redirect to login
 * Use this in Server Components that require authentication
 */
export async function getRequiredUser() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return session.user;
}

/**
 * Get the current user ID or null if not authenticated
 * Use this when you need to check auth status without redirecting
 */
export async function getUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

/**
 * Get the full session or null if not authenticated
 * Use this when you need access to the full session object
 */
export async function getSession() {
  return await auth();
}
