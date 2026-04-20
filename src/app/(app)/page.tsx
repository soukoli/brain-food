import { getDbAsync } from "@/lib/db";
import { projects, ideas } from "@/lib/db/schema";
import { eq, desc, and, isNotNull, gte, lt, count, sum, max, sql } from "drizzle-orm";
import { getRequiredUser } from "@/lib/auth-utils";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import type { RecentProject, ProjectStats } from "@/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getRequiredUser();
  const db = await getDbAsync();

  // Get start and end of today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get start of week (Monday)
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));

  // Parallel queries for stats and data
  const [
    projectCountResult,
    todayCountResult,
    totalTasksResult,
    inProgressCountResult,
    completedThisWeekResult,
    timeThisWeekResult,
    recentProjectsData,
    projectStatsData,
    recentTasks,
  ] = await Promise.all([
    // Count of projects
    db.select({ value: count() }).from(projects).where(eq(projects.userId, user.id)),

    // Count of today's tasks (scheduled for focus)
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

    // Count of total tasks (not deleted/archived)
    db.select({ value: count() }).from(ideas).where(eq(ideas.userId, user.id)),

    // Count of in-progress tasks
    db
      .select({ value: count() })
      .from(ideas)
      .where(and(eq(ideas.userId, user.id), eq(ideas.status, "in-progress"))),

    // Completed this week
    db
      .select({ value: count() })
      .from(ideas)
      .where(
        and(
          eq(ideas.userId, user.id),
          eq(ideas.status, "completed"),
          isNotNull(ideas.completedAt),
          gte(ideas.completedAt, startOfWeek)
        )
      ),

    // Total time logged this week
    db
      .select({ value: sum(ideas.timeSpentSeconds) })
      .from(ideas)
      .where(and(eq(ideas.userId, user.id), gte(ideas.updatedAt, startOfWeek))),

    // Recent projects with time spent and last activity
    db
      .select({
        id: projects.id,
        name: projects.name,
        color: projects.color,
        updatedAt: projects.updatedAt,
        totalTimeSpent: sum(ideas.timeSpentSeconds),
        lastIdeaUpdate: max(ideas.updatedAt),
      })
      .from(projects)
      .leftJoin(ideas, eq(projects.id, ideas.projectId))
      .where(eq(projects.userId, user.id))
      .groupBy(projects.id)
      .orderBy(desc(projects.updatedAt))
      .limit(5),

    // Project stats for comparison chart
    db
      .select({
        id: projects.id,
        name: projects.name,
        color: projects.color,
        updatedAt: projects.updatedAt,
        taskCount: count(ideas.id),
        completedCount: sql<number>`count(case when ${ideas.status} = 'completed' then 1 end)`,
        inProgressCount: sql<number>`count(case when ${ideas.status} = 'in-progress' then 1 end)`,
        totalTimeSpent: sum(ideas.timeSpentSeconds),
        lastIdeaUpdate: max(ideas.updatedAt),
      })
      .from(projects)
      .leftJoin(ideas, eq(projects.id, ideas.projectId))
      .where(eq(projects.userId, user.id))
      .groupBy(projects.id)
      .orderBy(desc(projects.updatedAt)),

    // Recent tasks - last 5 modified tasks with project info
    db.query.ideas.findMany({
      where: eq(ideas.userId, user.id),
      with: { project: true },
      orderBy: [desc(ideas.updatedAt)],
      limit: 5,
    }),
  ]);

  // Transform recent projects data
  const recentProjects: RecentProject[] = recentProjectsData.map((p) => ({
    id: p.id,
    name: p.name,
    color: p.color,
    totalTimeSpent: Number(p.totalTimeSpent) || 0,
    lastActivityAt: p.lastIdeaUpdate || p.updatedAt,
  }));

  // Transform project stats data
  const projectStats: ProjectStats[] = projectStatsData.map((p) => ({
    id: p.id,
    name: p.name,
    color: p.color,
    taskCount: Number(p.taskCount) || 0,
    completedCount: Number(p.completedCount) || 0,
    inProgressCount: Number(p.inProgressCount) || 0,
    totalTimeSpent: Number(p.totalTimeSpent) || 0,
    lastActivityAt: p.lastIdeaUpdate || p.updatedAt,
  }));

  // Extract first name from user
  const firstName = user.name?.split(" ")[0] || "there";

  return (
    <DashboardClient
      userName={firstName}
      userImage={user.image}
      stats={{
        projectCount: projectCountResult[0]?.value ?? 0,
        todayCount: todayCountResult[0]?.value ?? 0,
        totalTasks: totalTasksResult[0]?.value ?? 0,
        inProgressCount: inProgressCountResult[0]?.value ?? 0,
      }}
      weeklyStats={{
        completedThisWeek: completedThisWeekResult[0]?.value ?? 0,
        timeThisWeek: Number(timeThisWeekResult[0]?.value) || 0,
      }}
      recentProjects={recentProjects}
      projectStats={projectStats}
      recentTasks={recentTasks}
    />
  );
}
