import { getDbAsync } from "@/lib/db";
import { projects, ideas } from "@/lib/db/schema";
import { eq, desc, isNull, and } from "drizzle-orm";
import { getRequiredUser } from "@/lib/auth-utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProjectsWithIdeasList } from "@/components/projects/ProjectsWithIdeasList";
import { ProjectSheet } from "@/components/projects/ProjectSheet";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const user = await getRequiredUser();
  const db = await getDbAsync();

  // Get projects with their ideas (using relational query)
  const projectsWithIdeas = await db.query.projects.findMany({
    where: eq(projects.userId, user.id),
    with: {
      ideas: {
        orderBy: (ideas, { desc }) => [desc(ideas.createdAt)],
      },
    },
    orderBy: [desc(projects.createdAt)],
  });

  // Get orphan ideas (ideas without a project)
  const orphanIdeas = await db.query.ideas.findMany({
    where: and(
      eq(ideas.userId, user.id),
      isNull(ideas.projectId)
    ),
    orderBy: [desc(ideas.createdAt)],
  });

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
      <ProjectsWithIdeasList projects={projectsWithIdeas} orphanIdeas={orphanIdeas} />
    </>
  );
}
