import { NextResponse } from "next/server";
import { getDbAsync } from "@/lib/db";
import { ideas } from "@/lib/db/schema";
import { eq, desc, and, isNotNull, gte, lt } from "drizzle-orm";
import { getRequiredUser, ensureUserInDb } from "@/lib/auth-utils";
import { createIdeaSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

// GET /api/ideas - List ideas with filters
export async function GET(request: Request) {
  try {
    const user = await getRequiredUser();
    const db = await getDbAsync();

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");
    const scheduledForToday = searchParams.get("today") === "true";

    // Build where conditions
    const conditions = [eq(ideas.userId, user.id)];

    if (projectId) {
      conditions.push(eq(ideas.projectId, projectId));
    }

    if (status) {
      conditions.push(
        eq(ideas.status, status as "inbox" | "in-progress" | "completed" | "archived" | "deleted")
      );
    }

    if (scheduledForToday) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      conditions.push(isNotNull(ideas.scheduledForToday));
      conditions.push(gte(ideas.scheduledForToday, today));
      conditions.push(lt(ideas.scheduledForToday, tomorrow));
    }

    const ideasList = await db.query.ideas.findMany({
      where: and(...conditions),
      with: { project: true },
      orderBy: [desc(ideas.createdAt)],
    });

    return NextResponse.json({ data: ideasList });
  } catch (error) {
    console.error("Error fetching ideas:", error);
    return NextResponse.json({ error: "Failed to fetch ideas" }, { status: 500 });
  }
}

// POST /api/ideas - Create a new idea
export async function POST(request: Request) {
  try {
    const user = await getRequiredUser();
    const db = await getDbAsync();

    // Ensure user exists in database and get their stable DB user ID
    const dbUserId = await ensureUserInDb(user);

    const body = await request.json();
    const validatedData = createIdeaSchema.parse(body);

    // Convert scheduledForToday string to Date if present
    const { scheduledForToday, ...restData } = validatedData;

    const [newIdea] = await db
      .insert(ideas)
      .values({
        ...restData,
        userId: dbUserId,
        scheduledForToday: scheduledForToday ? new Date(scheduledForToday) : null,
      })
      .returning();

    // Fetch with project relation
    const ideaWithProject = await db.query.ideas.findFirst({
      where: eq(ideas.id, newIdea.id),
      with: { project: true },
    });

    return NextResponse.json({ data: ideaWithProject }, { status: 201 });
  } catch (error) {
    console.error("Error creating idea:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid idea data" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create idea" }, { status: 500 });
  }
}
