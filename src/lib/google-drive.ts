import { google } from "googleapis";
import { GaxiosError } from "gaxios";

const BACKUP_FILENAME = "brainfood-backup.json";

/**
 * Parse Google API error for user-friendly message
 */
function parseGoogleError(error: unknown): string {
  if (error instanceof GaxiosError) {
    const status = error.response?.status;
    const message = error.response?.data?.error?.message || error.message;

    switch (status) {
      case 401:
        return "Authentication expired. Please sign out and sign in again.";
      case 403:
        return "Permission denied. Please sign out, sign in again, and grant Google Drive access.";
      case 404:
        return "Backup file not found.";
      case 429:
        return "Too many requests. Please wait a moment and try again.";
      case 500:
      case 503:
        return "Google Drive is temporarily unavailable. Please try again later.";
      default:
        return message || "Unknown Google Drive error";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error occurred";
}

/**
 * Create OAuth2 client with tokens from session
 * Automatically handles token refresh
 */
async function createOAuth2Client(accessToken: string, refreshToken?: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.AUTH_GOOGLE_ID,
    process.env.AUTH_GOOGLE_SECRET
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  // Set up automatic token refresh
  oauth2Client.on("tokens", (tokens) => {
    if (tokens.refresh_token) {
      console.log("[Google Drive] New refresh token received");
    }
    if (tokens.access_token) {
      console.log("[Google Drive] Access token refreshed");
    }
  });

  // Force refresh if we have a refresh token (ensures fresh access token)
  if (refreshToken) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);
      console.log("[Google Drive] Token refreshed successfully");
    } catch (error) {
      console.warn("[Google Drive] Token refresh failed, using existing token:", error);
      // Continue with existing token - it might still be valid
    }
  }

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
    const oauth2Client = await createOAuth2Client(accessToken, refreshToken);
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    console.log("[Google Drive] Starting backup save...");

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
      console.log("[Google Drive] Updating existing backup file...");
      const response = await drive.files.update({
        fileId: existingFile.id,
        media: {
          mimeType: "application/json",
          body: fileContent,
        },
      });
      console.log("[Google Drive] Backup updated successfully, fileId:", response.data.id);
      return { success: true, fileId: response.data.id ?? undefined };
    } else {
      // Create new backup file
      console.log("[Google Drive] Creating new backup file...");
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
      console.log("[Google Drive] Backup created successfully, fileId:", response.data.id);
      return { success: true, fileId: response.data.id ?? undefined };
    }
  } catch (error) {
    console.error("[Google Drive] Backup save error:", error);
    return {
      success: false,
      error: parseGoogleError(error),
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
    const oauth2Client = await createOAuth2Client(accessToken, refreshToken);
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    console.log("[Google Drive] Loading backup...");

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

    console.log("[Google Drive] Backup loaded successfully");
    return { success: true, data };
  } catch (error) {
    console.error("[Google Drive] Backup load error:", error);
    return {
      success: false,
      error: parseGoogleError(error),
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
    const oauth2Client = await createOAuth2Client(accessToken, refreshToken);
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
    console.error("[Google Drive] Info fetch error:", error);
    return {
      success: false,
      exists: false,
      error: parseGoogleError(error),
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
    const oauth2Client = await createOAuth2Client(accessToken, refreshToken);
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    const files = await drive.files.list({
      spaces: "appDataFolder",
      q: `name='${BACKUP_FILENAME}'`,
      fields: "files(id)",
    });

    const backupFile = files.data.files?.[0];

    if (backupFile?.id) {
      await drive.files.delete({ fileId: backupFile.id });
      console.log("[Google Drive] Backup deleted successfully");
    }

    return { success: true };
  } catch (error) {
    console.error("[Google Drive] Backup delete error:", error);
    return {
      success: false,
      error: parseGoogleError(error),
    };
  }
}
