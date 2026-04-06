import { getDbAsync } from "@/lib/db";
import { ideas } from "@/lib/db/schema";
import { eq, and, isNotNull, gte, lt, or, desc } from "drizzle-orm";
import { getRequiredUser } from "@/lib/auth-utils";
import { FocusClient } from "@/components/focus/FocusClient";

export const dynamic = "force-dynamic";

export default async function FocusPage() {
  const user = await getRequiredUser();
  const db = await getDbAsync();

  // Get start and end of today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get active tasks (scheduled for today and not completed)
  const activeTasks = await db.query.ideas.findMany({
    where: and(
      eq(ideas.userId, user.id),
      or(
        // Scheduled for today
        and(
          isNotNull(ideas.scheduledForToday),
          gte(ideas.scheduledForToday, today),
          lt(ideas.scheduledForToday, tomorrow)
        ),
        // Or currently in progress
        eq(ideas.status, "in-progress")
      ),
      // Not completed
      or(eq(ideas.status, "inbox"), eq(ideas.status, "in-progress"))
    ),
    with: { project: true },
    orderBy: [desc(ideas.isTimerRunning), desc(ideas.updatedAt)],
  });

  // Get completed today
  const completedToday = await db.query.ideas.findMany({
    where: and(
      eq(ideas.userId, user.id),
      eq(ideas.status, "completed"),
      isNotNull(ideas.completedAt),
      gte(ideas.completedAt, today),
      lt(ideas.completedAt, tomorrow)
    ),
    with: { project: true },
    orderBy: [desc(ideas.completedAt)],
  });

  return <FocusClient activeTasks={activeTasks} completedToday={completedToday} />;
}
