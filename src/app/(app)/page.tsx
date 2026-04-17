import { getDbAsync } from "@/lib/db";
import { projects, ideas } from "@/lib/db/schema";
import { eq, desc, and, isNotNull, gte, lt, count } from "drizzle-orm";
import { getRequiredUser } from "@/lib/auth-utils";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getRequiredUser();
  const db = await getDbAsync();

  // Get start and end of today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Parallel queries for stats
  const [
    projectCountResult,
    todayCountResult,
    totalIdeasResult,
    inProgressCountResult,
    recentIdeas,
  ] = await Promise.all([
    // Count of projects
    db.select({ value: count() }).from(projects).where(eq(projects.userId, user.id)),

    // Count of today's tasks
    db
      .select({ value: count() })
      .from(ideas)
      .where(
        and(
          eq(ideas.userId, user.id),
          isNotNull(ideas.scheduledForToday),
          gte(ideas.scheduledForToday, today),
          lt(ideas.scheduledForToday, tomorrow)
        )
      ),

    // Count of total ideas (not deleted/archived)
    db
      .select({ value: count() })
      .from(ideas)
      .where(
        and(
          eq(ideas.userId, user.id)
          // Exclude deleted and archived
        )
      ),

    // Count of in-progress tasks
    db
      .select({ value: count() })
      .from(ideas)
      .where(and(eq(ideas.userId, user.id), eq(ideas.status, "in-progress"))),

    // 5 most recent ideas with project info
    db.query.ideas.findMany({
      where: eq(ideas.userId, user.id),
      with: { project: true },
      orderBy: [desc(ideas.createdAt)],
      limit: 5,
    }),
  ]);

  // Extract first name from user
  const firstName = user.name?.split(" ")[0] || "there";

  return (
    <DashboardClient
      userName={firstName}
      stats={{
        projectCount: projectCountResult[0]?.value ?? 0,
        todayCount: todayCountResult[0]?.value ?? 0,
        totalIdeas: totalIdeasResult[0]?.value ?? 0,
        inProgressCount: inProgressCountResult[0]?.value ?? 0,
      }}
      recentIdeas={recentIdeas}
    />
  );
}
