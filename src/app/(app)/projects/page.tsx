import { getDbAsync } from "@/lib/db";
import { projects, ideas } from "@/lib/db/schema";
import { eq, desc, isNull, and, asc } from "drizzle-orm";
import { getRequiredUser } from "@/lib/auth-utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProjectsWithIdeasList } from "@/components/projects/ProjectsWithIdeasList";
import { ProjectSheet } from "@/components/projects/ProjectSheet";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const user = await getRequiredUser();
  const db = await getDbAsync();

  // Get projects with their ideas (using relational query), sorted by sortOrder
  const projectsWithIdeas = await db.query.projects.findMany({
    where: eq(projects.userId, user.id),
    with: {
      ideas: {
        orderBy: (ideas, { desc }) => [desc(ideas.createdAt)],
      },
    },
    orderBy: [asc(projects.sortOrder), desc(projects.createdAt)],
  });

  // Get orphan ideas (ideas without a project)
  const orphanIdeas = await db.query.ideas.findMany({
    where: and(eq(ideas.userId, user.id), isNull(ideas.projectId)),
    orderBy: [desc(ideas.createdAt)],
  });

  return (
    <>
      <PageHeader
        title="My Projects"
        right={
          <ProjectSheet
            trigger={
              <button className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-sm hover:bg-primary-hover transition-colors">
                <Plus className="h-5 w-5 text-white" />
              </button>
            }
          />
        }
      />
      <ProjectsWithIdeasList projects={projectsWithIdeas} orphanIdeas={orphanIdeas} />
    </>
  );
}
