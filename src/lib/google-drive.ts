import { google } from "googleapis";

const BACKUP_FILENAME = "brainfood-backup.json";

/**
 * Create OAuth2 client with tokens from session
 */
function createOAuth2Client(accessToken: string, refreshToken?: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.AUTH_GOOGLE_ID,
    process.env.AUTH_GOOGLE_SECRET
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  return oauth2Client;
}

/**
 * Export data structure for backup
 */
export interface BackupData {
  version: number;
  exportedAt: string;
  user: {
    id: string;
    email: string | null;
    name: string | null;
  };
  projects: Array<{
    id: string;
    name: string;
    description: string | null;
    color: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  }>;
  ideas: Array<{
    id: string;
    title: string;
    description: string | null;
    linkUrl: string | null;
    voiceTranscript: string | null;
    projectId: string | null;
    status: string;
    priority: string | null;
    captureMethod: string | null;
    timeSpentSeconds: number;
    scheduledForToday: string | null;
    startedAt: string | null;
    completedAt: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  tags: Array<{
    id: string;
    name: string;
    createdAt: string;
  }>;
}

/**
 * Save backup to Google Drive appdata folder
 * Uses appDataFolder which is hidden from user and only accessible by this app
 */
export async function saveBackupToDrive(
  accessToken: string,
  refreshToken: string | undefined,
  backupData: BackupData
): Promise<{ success: boolean; fileId?: string; error?: string }> {
  try {
    const oauth2Client = createOAuth2Client(accessToken, refreshToken);
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // Check if backup file already exists
    const existingFiles = await drive.files.list({
      spaces: "appDataFolder",
      q: `name='${BACKUP_FILENAME}'`,
      fields: "files(id, name)",
    });

    const existingFile = existingFiles.data.files?.[0];

    const fileContent = JSON.stringify(backupData, null, 2);

    if (existingFile?.id) {
      // Update existing backup
      const response = await drive.files.update({
        fileId: existingFile.id,
        media: {
          mimeType: "application/json",
          body: fileContent,
        },
      });
      return { success: true, fileId: response.data.id ?? undefined };
    } else {
      // Create new backup file
      const response = await drive.files.create({
        requestBody: {
          name: BACKUP_FILENAME,
          parents: ["appDataFolder"],
        },
        media: {
          mimeType: "application/json",
          body: fileContent,
        },
        fields: "id",
      });
      return { success: true, fileId: response.data.id ?? undefined };
    }
  } catch (error) {
    console.error("Google Drive backup error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save backup",
    };
  }
}

/**
 * Load backup from Google Drive appdata folder
 */
export async function loadBackupFromDrive(
  accessToken: string,
  refreshToken: string | undefined
): Promise<{ success: boolean; data?: BackupData; error?: string }> {
  try {
    const oauth2Client = createOAuth2Client(accessToken, refreshToken);
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // Find backup file
    const files = await drive.files.list({
      spaces: "appDataFolder",
      q: `name='${BACKUP_FILENAME}'`,
      fields: "files(id, name, modifiedTime)",
    });

    const backupFile = files.data.files?.[0];

    if (!backupFile?.id) {
      return { success: false, error: "No backup found" };
    }

    // Download file content
    const response = await drive.files.get(
      {
        fileId: backupFile.id,
        alt: "media",
      },
      { responseType: "text" }
    );

    // Parse the JSON response
    const data =
      typeof response.data === "string"
        ? (JSON.parse(response.data) as BackupData)
        : (response.data as unknown as BackupData);

    return { success: true, data };
  } catch (error) {
    console.error("Google Drive restore error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load backup",
    };
  }
}

/**
 * Get backup info (without downloading full content)
 */
export async function getBackupInfo(
  accessToken: string,
  refreshToken: string | undefined
): Promise<{
  success: boolean;
  exists: boolean;
  modifiedTime?: string;
  error?: string;
}> {
  try {
    const oauth2Client = createOAuth2Client(accessToken, refreshToken);
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    const files = await drive.files.list({
      spaces: "appDataFolder",
      q: `name='${BACKUP_FILENAME}'`,
      fields: "files(id, name, modifiedTime)",
    });

    const backupFile = files.data.files?.[0];

    return {
      success: true,
      exists: !!backupFile,
      modifiedTime: backupFile?.modifiedTime ?? undefined,
    };
  } catch (error) {
    console.error("Google Drive info error:", error);
    return {
      success: false,
      exists: false,
      error: error instanceof Error ? error.message : "Failed to check backup",
    };
  }
}

/**
 * Delete backup from Google Drive
 */
export async function deleteBackupFromDrive(
  accessToken: string,
  refreshToken: string | undefined
): Promise<{ success: boolean; error?: string }> {
  try {
    const oauth2Client = createOAuth2Client(accessToken, refreshToken);
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    const files = await drive.files.list({
      spaces: "appDataFolder",
      q: `name='${BACKUP_FILENAME}'`,
      fields: "files(id)",
    });

    const backupFile = files.data.files?.[0];

    if (backupFile?.id) {
      await drive.files.delete({ fileId: backupFile.id });
    }

    return { success: true };
  } catch (error) {
    console.error("Google Drive delete error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete backup",
    };
  }
}
