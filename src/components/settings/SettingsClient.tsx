"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Block, BlockTitle } from "@/components/ui/block";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CloudUpload,
  CloudDownload,
  LogOut,
  User,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

interface SettingsClientProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

interface BackupInfo {
  exists: boolean;
  lastBackup: string | null;
}

export function SettingsClient({ user }: SettingsClientProps) {
  const router = useRouter();
  const [backupInfo, setBackupInfo] = useState<BackupInfo | null>(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(true);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);

  // Fetch backup info on mount
  useEffect(() => {
    fetchBackupInfo();
  }, []);

  const fetchBackupInfo = async () => {
    setIsLoadingInfo(true);
    try {
      const response = await fetch("/api/backup");
      if (response.ok) {
        const { data } = await response.json();
        setBackupInfo(data);
      } else {
        const { error } = await response.json();
        if (error?.includes("access token")) {
          // Need to re-authenticate
          setBackupInfo(null);
        }
      }
    } catch (error) {
      console.error("Failed to fetch backup info:", error);
    } finally {
      setIsLoadingInfo(false);
    }
  };

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      const response = await fetch("/api/backup", {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Backup failed");
      }

      toast.success(
        `Backup created! ${result.data.projectCount} projects, ${result.data.ideaCount} ideas saved.`
      );
      fetchBackupInfo();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Backup failed");
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      const response = await fetch("/api/backup", {
        method: "PUT",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Restore failed");
      }

      toast.success(
        `Restored ${result.data.imported.projects} projects and ${result.data.imported.ideas} ideas!`
      );
      setRestoreDialogOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Restore failed");
    } finally {
      setIsRestoring(false);
    }
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <>
      <PageHeader title="Settings" showBack />

      {/* User Profile */}
      <BlockTitle>Account</BlockTitle>
      <Block>
        <Card className="p-4">
          <div className="flex items-center gap-4">
            {user.image ? (
              <img src={user.image} alt={user.name || "User"} className="w-14 h-14 rounded-full" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                <User className="w-7 h-7 text-slate-500" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg text-slate-900 dark:text-slate-50">
                {user.name || "User"}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
        </Card>
      </Block>

      {/* Backup & Restore */}
      <BlockTitle className="!mt-6">Backup & Restore</BlockTitle>
      <Block className="space-y-3">
        {/* Backup Status Card */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-slate-50">
                Google Drive Backup
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Your data is stored securely in your Google Drive
              </p>
            </div>
            {isLoadingInfo ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            ) : backupInfo?.exists ? (
              <Badge variant="success" className="gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Backed up
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <AlertCircle className="w-3 h-3" />
                No backup
              </Badge>
            )}
          </div>

          {backupInfo?.lastBackup && (
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-4">
              <Clock className="w-4 h-4" />
              Last backup: {formatDate(backupInfo.lastBackup)}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleBackup}
              disabled={isBackingUp || isLoadingInfo}
              className="gap-2"
            >
              {isBackingUp ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CloudUpload className="w-4 h-4" />
              )}
              {isBackingUp ? "Backing up..." : "Backup Now"}
            </Button>

            <Button
              variant="outline"
              onClick={() => setRestoreDialogOpen(true)}
              disabled={!backupInfo?.exists || isLoadingInfo}
              className="gap-2"
            >
              <CloudDownload className="w-4 h-4" />
              Restore
            </Button>
          </div>
        </Card>

        {/* Info text */}
        <p className="text-xs text-slate-500 dark:text-slate-400 px-1">
          Backups include all your projects, ideas, and tags. They are stored in a private app
          folder in your Google Drive that only BrainFood can access.
        </p>
      </Block>

      {/* Sign Out */}
      <Block className="!mt-8">
        <Button
          variant="outline"
          className="w-full gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </Block>

      {/* Restore Confirmation Dialog */}
      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore from Backup</DialogTitle>
            <DialogDescription>
              This will import all projects and ideas from your backup. Existing data will NOT be
              deleted - the backup data will be added to your current data.
              {backupInfo?.lastBackup && (
                <span className="block mt-2 font-medium">
                  Backup from: {formatDate(backupInfo.lastBackup)}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRestore} disabled={isRestoring}>
              {isRestoring ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Restoring...
                </>
              ) : (
                "Restore"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
