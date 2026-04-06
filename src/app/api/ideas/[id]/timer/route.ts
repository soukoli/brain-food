import { NextResponse } from "next/server";
import { getDbAsync } from "@/lib/db";
import { ideas } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getRequiredUser } from "@/lib/auth-utils";
import { timerActionSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/ideas/[id]/timer - Start/Pause/Complete timer
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getRequiredUser();
    const db = await getDbAsync();

    const body = await request.json();
    const { action } = timerActionSchema.parse(body);

    // Get the idea
    const idea = await db.query.ideas.findFirst({
      where: and(eq(ideas.id, id), eq(ideas.userId, user.id)),
    });

    if (!idea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    const now = new Date();
    let updateData: Record<string, unknown> = { updatedAt: now };

    switch (action) {
      case "start":
        // Start the timer
        if (idea.isTimerRunning) {
          return NextResponse.json(
            { error: "Timer is already running" },
            { status: 400 }
          );
        }
        updateData = {
          ...updateData,
          isTimerRunning: true,
          lastTimerStartedAt: now,
          status: "in-progress",
          startedAt: idea.startedAt || now,
        };
        break;

      case "pause":
        // Pause the timer and update time spent
        if (!idea.isTimerRunning) {
          return NextResponse.json(
            { error: "Timer is not running" },
            { status: 400 }
          );
        }
        const elapsed = idea.lastTimerStartedAt
          ? Math.floor((now.getTime() - new Date(idea.lastTimerStartedAt).getTime()) / 1000)
          : 0;
        updateData = {
          ...updateData,
          isTimerRunning: false,
          timeSpentSeconds: idea.timeSpentSeconds + elapsed,
          lastTimerStartedAt: null,
        };
        break;

      case "complete":
        // Complete the task
        let finalTimeSpent = idea.timeSpentSeconds;
        if (idea.isTimerRunning && idea.lastTimerStartedAt) {
          const elapsedOnComplete = Math.floor(
            (now.getTime() - new Date(idea.lastTimerStartedAt).getTime()) / 1000
          );
          finalTimeSpent += elapsedOnComplete;
        }
        updateData = {
          ...updateData,
          isTimerRunning: false,
          timeSpentSeconds: finalTimeSpent,
          lastTimerStartedAt: null,
          status: "completed",
          completedAt: now,
        };
        break;
    }

    const [updatedIdea] = await db
      .update(ideas)
      .set(updateData)
      .where(and(eq(ideas.id, id), eq(ideas.userId, user.id)))
      .returning();

    // Fetch with project relation
    const ideaWithProject = await db.query.ideas.findFirst({
      where: eq(ideas.id, updatedIdea.id),
      with: { project: true },
    });

    return NextResponse.json({ data: ideaWithProject });
  } catch (error) {
    console.error("Error updating timer:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid timer action" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update timer" },
      { status: 500 }
    );
  }
}
