import { getDbAsync } from "@/lib/db";
import { projects, ideas } from "@/lib/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { getRequiredUser } from "@/lib/auth-utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProjectList } from "@/components/projects/ProjectList";
import { ProjectSheet } from "@/components/projects/ProjectSheet";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
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

  return (
    <>
      <PageHeader
        title="Projects"
        right={
          <ProjectSheet
            trigger={
              <Button size="icon" variant="ghost">
                <Plus className="h-5 w-5" />
              </Button>
            }
          />
        }
      />
      <ProjectList projects={projectsWithCount} />
    </>
  );
}
