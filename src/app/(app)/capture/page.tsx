import { getDbAsync } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getRequiredUser } from "@/lib/auth-utils";
import { CaptureForm } from "@/components/capture/CaptureForm";

export const dynamic = "force-dynamic";

export default async function CapturePage() {
  const user = await getRequiredUser();
  const db = await getDbAsync();

  const userProjects = await db.query.projects.findMany({
    where: eq(projects.userId, user.id),
    orderBy: [desc(projects.createdAt)],
  });

  return <CaptureForm projects={userProjects} />;
}
