import { NextResponse } from "next/server";
import { getDbAsync } from "@/lib/db";
import { projects, ideas } from "@/lib/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { getRequiredUser } from "@/lib/auth-utils";
import { createProjectSchema } from "@/lib/validations";
import { PROJECT_COLORS } from "@/lib/constants";

export const dynamic = "force-dynamic";

// GET /api/projects - List all projects for user
export async function GET() {
  try {
    const user = await getRequiredUser();
    const db = await getDbAsync();

    // Get projects with idea count
    const projectsWithCount = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        color: projects.color,
        status: projects.status,
        userId: projects.userId,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        ideaCount: count(ideas.id),
      })
      .from(projects)
      .leftJoin(ideas, eq(projects.id, ideas.projectId))
      .where(eq(projects.userId, user.id))
      .groupBy(projects.id)
      .orderBy(desc(projects.createdAt));

    return NextResponse.json({ data: projectsWithCount });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project
export async function POST(request: Request) {
  try {
    const user = await getRequiredUser();
    const db = await getDbAsync();

    const body = await request.json();
    const validatedData = createProjectSchema.parse(body);

    // Validate color is from palette
    const isValidColor = PROJECT_COLORS.some((c) => c.value === validatedData.color);
    if (!isValidColor) {
      return NextResponse.json(
        { error: "Invalid color. Please select from the color palette." },
        { status: 400 }
      );
    }

    const [newProject] = await db
      .insert(projects)
      .values({
        ...validatedData,
        userId: user.id,
      })
      .returning();

    return NextResponse.json({ data: newProject }, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Invalid project data" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
