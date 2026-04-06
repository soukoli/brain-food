import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

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
