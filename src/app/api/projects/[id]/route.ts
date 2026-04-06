import { NextResponse } from "next/server";
import { getDbAsync } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getRequiredUser } from "@/lib/auth-utils";
import { updateProjectSchema } from "@/lib/validations";
import { PROJECT_COLORS } from "@/lib/constants";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/projects/[id] - Get a single project with ideas
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getRequiredUser();
    const db = await getDbAsync();

    const project = await db.query.projects.findFirst({
      where: and(eq(projects.id, id), eq(projects.userId, user.id)),
      with: {
        ideas: {
          orderBy: (ideas, { desc }) => [desc(ideas.createdAt)],
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ data: project });
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[id] - Update a project
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getRequiredUser();
    const db = await getDbAsync();

    const body = await request.json();
    const validatedData = updateProjectSchema.parse(body);

    // Validate color if provided
    if (validatedData.color) {
      const isValidColor = PROJECT_COLORS.some((c) => c.value === validatedData.color);
      if (!isValidColor) {
        return NextResponse.json(
          { error: "Invalid color. Please select from the color palette." },
          { status: 400 }
        );
      }
    }

    // Check if project exists and belongs to user
    const existingProject = await db.query.projects.findFirst({
      where: and(eq(projects.id, id), eq(projects.userId, user.id)),
    });

    if (!existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const [updatedProject] = await db
      .update(projects)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(and(eq(projects.id, id), eq(projects.userId, user.id)))
      .returning();

    return NextResponse.json({ data: updatedProject });
  } catch (error) {
    console.error("Error updating project:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid project data" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Delete a project
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getRequiredUser();
    const db = await getDbAsync();

    // Check if project exists and belongs to user
    const existingProject = await db.query.projects.findFirst({
      where: and(eq(projects.id, id), eq(projects.userId, user.id)),
    });

    if (!existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Delete project (ideas will have projectId set to null due to ON DELETE SET NULL)
    await db
      .delete(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, user.id)));

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
