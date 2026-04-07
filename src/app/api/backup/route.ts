import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDbAsync } from "@/lib/db";
import { projects, ideas, tags } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  saveBackupToDrive,
  loadBackupFromDrive,
  getBackupInfo,
  type BackupData,
} from "@/lib/google-drive";

export const dynamic = "force-dynamic";

/**
 * GET /api/backup - Get backup status/info
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.accessToken) {
      return NextResponse.json(
        { error: "No Google access token. Please sign out and sign in again." },
        { status: 401 }
      );
    }

    const info = await getBackupInfo(session.accessToken, session.refreshToken);

    if (!info.success) {
      return NextResponse.json({ error: info.error }, { status: 500 });
    }

    return NextResponse.json({
      data: {
        exists: info.exists,
        lastBackup: info.modifiedTime || null,
      },
    });
  } catch (error) {
    console.error("Backup info error:", error);
    return NextResponse.json({ error: "Failed to get backup info" }, { status: 500 });
  }
}

/**
 * POST /api/backup - Create/update backup to Google Drive
 */
export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.accessToken) {
      return NextResponse.json(
        { error: "No Google access token. Please sign out and sign in again." },
        { status: 401 }
      );
    }

    const db = await getDbAsync();

    // Fetch all user data
    const [userProjects, userIdeas, userTags] = await Promise.all([
      db.query.projects.findMany({
        where: eq(projects.userId, session.user.id),
      }),
      db.query.ideas.findMany({
        where: eq(ideas.userId, session.user.id),
      }),
      db.query.tags.findMany({
        where: eq(tags.userId, session.user.id),
      }),
    ]);

    // Create backup data
    const backupData: BackupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      user: {
        id: session.user.id,
        email: session.user.email ?? null,
        name: session.user.name ?? null,
      },
      projects: userProjects.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        color: p.color,
        status: p.status,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
      ideas: userIdeas.map((i) => ({
        id: i.id,
        title: i.title,
        description: i.description,
        linkUrl: i.linkUrl,
        voiceTranscript: i.voiceTranscript,
        projectId: i.projectId,
        status: i.status,
        priority: i.priority,
        captureMethod: i.captureMethod,
        timeSpentSeconds: i.timeSpentSeconds,
        scheduledForToday: i.scheduledForToday?.toISOString() ?? null,
        startedAt: i.startedAt?.toISOString() ?? null,
        completedAt: i.completedAt?.toISOString() ?? null,
        createdAt: i.createdAt.toISOString(),
        updatedAt: i.updatedAt.toISOString(),
      })),
      tags: userTags.map((t) => ({
        id: t.id,
        name: t.name,
        createdAt: t.createdAt.toISOString(),
      })),
    };

    // Save to Google Drive
    const result = await saveBackupToDrive(session.accessToken, session.refreshToken, backupData);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      data: {
        success: true,
        fileId: result.fileId,
        projectCount: userProjects.length,
        ideaCount: userIdeas.length,
        tagCount: userTags.length,
        exportedAt: backupData.exportedAt,
      },
    });
  } catch (error) {
    console.error("Backup create error:", error);
    return NextResponse.json({ error: "Failed to create backup" }, { status: 500 });
  }
}

/**
 * PUT /api/backup - Restore from Google Drive backup
 */
export async function PUT() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.accessToken) {
      return NextResponse.json(
        { error: "No Google access token. Please sign out and sign in again." },
        { status: 401 }
      );
    }

    // Load backup from Google Drive
    const result = await loadBackupFromDrive(session.accessToken, session.refreshToken);

    if (!result.success || !result.data) {
      return NextResponse.json({ error: result.error || "No backup found" }, { status: 404 });
    }

    const backupData = result.data;
    const db = await getDbAsync();

    // Map old project IDs to new IDs
    const projectIdMap = new Map<string, string>();

    // Import projects
    for (const project of backupData.projects) {
      const [newProject] = await db
        .insert(projects)
        .values({
          name: project.name,
          description: project.description,
          color: project.color,
          status: project.status as "active" | "archived" | "completed",
          userId: session.user.id,
          createdAt: new Date(project.createdAt),
          updatedAt: new Date(project.updatedAt),
        })
        .returning();

      projectIdMap.set(project.id, newProject.id);
    }

    // Import ideas with mapped project IDs
    let importedIdeas = 0;
    for (const idea of backupData.ideas) {
      const newProjectId = idea.projectId ? projectIdMap.get(idea.projectId) : null;

      await db.insert(ideas).values({
        title: idea.title,
        description: idea.description,
        linkUrl: idea.linkUrl,
        voiceTranscript: idea.voiceTranscript,
        projectId: newProjectId ?? null,
        userId: session.user.id,
        status: idea.status as "inbox" | "in-progress" | "completed" | "archived" | "deleted",
        priority: idea.priority as "low" | "medium" | "high" | "urgent" | null,
        captureMethod: idea.captureMethod as "text" | "voice" | "link" | null,
        timeSpentSeconds: idea.timeSpentSeconds,
        scheduledForToday: idea.scheduledForToday ? new Date(idea.scheduledForToday) : null,
        startedAt: idea.startedAt ? new Date(idea.startedAt) : null,
        completedAt: idea.completedAt ? new Date(idea.completedAt) : null,
        createdAt: new Date(idea.createdAt),
        updatedAt: new Date(idea.updatedAt),
      });
      importedIdeas++;
    }

    // Import tags
    let importedTags = 0;
    for (const tag of backupData.tags) {
      try {
        await db.insert(tags).values({
          name: tag.name,
          userId: session.user.id,
          createdAt: new Date(tag.createdAt),
        });
        importedTags++;
      } catch {
        // Tag might already exist (unique constraint)
        console.log(`Tag "${tag.name}" already exists, skipping`);
      }
    }

    return NextResponse.json({
      data: {
        success: true,
        imported: {
          projects: backupData.projects.length,
          ideas: importedIdeas,
          tags: importedTags,
        },
        backupDate: backupData.exportedAt,
      },
    });
  } catch (error) {
    console.error("Backup restore error:", error);
    return NextResponse.json({ error: "Failed to restore backup" }, { status: 500 });
  }
}
