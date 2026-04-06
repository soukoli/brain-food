import { NextResponse } from "next/server";
import { getDbAsync } from "@/lib/db";
import { ideas } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getRequiredUser } from "@/lib/auth-utils";
import { updateIdeaSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/ideas/[id] - Get a single idea
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getRequiredUser();
    const db = await getDbAsync();

    const idea = await db.query.ideas.findFirst({
      where: and(eq(ideas.id, id), eq(ideas.userId, user.id)),
      with: { project: true },
    });

    if (!idea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    return NextResponse.json({ data: idea });
  } catch (error) {
    console.error("Error fetching idea:", error);
    return NextResponse.json(
      { error: "Failed to fetch idea" },
      { status: 500 }
    );
  }
}

// PATCH /api/ideas/[id] - Update an idea
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getRequiredUser();
    const db = await getDbAsync();

    const body = await request.json();
    const validatedData = updateIdeaSchema.parse(body);

    // Check if idea exists and belongs to user
    const existingIdea = await db.query.ideas.findFirst({
      where: and(eq(ideas.id, id), eq(ideas.userId, user.id)),
    });

    if (!existingIdea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    // Handle scheduledForToday conversion
    const updateData: Record<string, unknown> = {
      ...validatedData,
      updatedAt: new Date(),
    };

    if (validatedData.scheduledForToday) {
      updateData.scheduledForToday = new Date(validatedData.scheduledForToday);
    } else if (validatedData.scheduledForToday === null) {
      updateData.scheduledForToday = null;
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
    console.error("Error updating idea:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid idea data" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update idea" },
      { status: 500 }
    );
  }
}

// DELETE /api/ideas/[id] - Delete an idea
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getRequiredUser();
    const db = await getDbAsync();

    // Check if idea exists and belongs to user
    const existingIdea = await db.query.ideas.findFirst({
      where: and(eq(ideas.id, id), eq(ideas.userId, user.id)),
    });

    if (!existingIdea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    await db.delete(ideas).where(and(eq(ideas.id, id), eq(ideas.userId, user.id)));

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error("Error deleting idea:", error);
    return NextResponse.json(
      { error: "Failed to delete idea" },
      { status: 500 }
    );
  }
}
