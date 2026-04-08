import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDbAsync } from "@/lib/db";
import { users, projects, ideas, tags } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Ensure user exists in database, create if not
 * Call this before any database operation that requires user_id foreign key
 *
 * Handles OAuth client recreation: when a new OAuth client is created,
 * users get new IDs but same email. We check by email and migrate data.
 */
export async function ensureUserInDb(user: {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}): Promise<void> {
  const db = await getDbAsync();

  // First check if user already exists with this ID
  const existingById = await db.query.users.findFirst({
    where: eq(users.id, user.id),
  });

  if (existingById) {
    // User exists with correct ID, nothing to do
    return;
  }

  // Check if user exists with same email but different ID (OAuth client recreated)
  if (user.email) {
    const existingByEmail = await db.query.users.findFirst({
      where: eq(users.email, user.email),
    });

    if (existingByEmail) {
      // User exists with old ID - need to migrate to new ID
      const oldId = existingByEmail.id;
      const newId = user.id;

      // Step 1: Create new user record first (so FK references work)
      await db.insert(users).values({
        id: newId,
        name: user.name || existingByEmail.name,
        email: null, // Temporarily null to avoid unique constraint
        image: user.image || existingByEmail.image,
      });

      // Step 2: Update all foreign key references to new user
      await db.update(projects).set({ userId: newId }).where(eq(projects.userId, oldId));
      await db.update(ideas).set({ userId: newId }).where(eq(ideas.userId, oldId));
      await db.update(tags).set({ userId: newId }).where(eq(tags.userId, oldId));

      // Step 3: Delete old user record
      await db.delete(users).where(eq(users.id, oldId));

      // Step 4: Update new user with email
      await db.update(users).set({ email: user.email }).where(eq(users.id, newId));

      return;
    }
  }

  // User doesn't exist at all - create new
  await db.insert(users).values({
    id: user.id,
    name: user.name || null,
    email: user.email || null,
    image: user.image || null,
  });
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
