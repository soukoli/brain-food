import { getDbAsync } from "@/lib/db";
import { projects, ideas } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getRequiredUser } from "@/lib/auth-utils";
import { notFound } from "next/navigation";
import { ProjectDetailClient } from "@/components/projects/ProjectDetailClient";

export const dynamic = "force-dynamic";

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params;
  const user = await getRequiredUser();
  const db = await getDbAsync();

  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, id), eq(projects.userId, user.id)),
  });

  if (!project) {
    notFound();
  }

  const projectIdeas = await db.query.ideas.findMany({
    where: and(eq(ideas.projectId, id), eq(ideas.userId, user.id)),
    orderBy: [desc(ideas.createdAt)],
  });

  return <ProjectDetailClient project={project} ideas={projectIdeas} />;
}
