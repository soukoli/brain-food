"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  ChevronRight,
  Shield,
  Bell,
  HelpCircle,
  Sun,
  Moon,
  Monitor,
  Palette,
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/components/providers/ThemeProvider";

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
  const { theme, setTheme, resolvedTheme } = useTheme();
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
      <PageHeader title="Settings" />

      <div className="px-4 space-y-6 pb-4">
        {/* User Profile Card */}
        <Card className="p-6 text-center">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name || "User"}
              className="w-20 h-20 rounded-full mx-auto mb-3 border-4 border-primary-light"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary-light mx-auto mb-3 flex items-center justify-center">
              <User className="w-10 h-10 text-primary" />
            </div>
          )}
          <h2 className="text-xl font-bold text-text-primary">{user.name || "User"}</h2>
          <p className="text-sm text-text-secondary">{user.email}</p>
        </Card>

        {/* Appearance Section */}
        <div>
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide px-1 mb-3">
            Appearance
          </h3>
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center">
                <Palette className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-text-primary">Theme</h4>
                <p className="text-xs text-text-secondary">
                  Currently: {resolvedTheme === "dark" ? "Dark" : "Light"} mode
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <ThemeButton
                active={theme === "light"}
                onClick={() => setTheme("light")}
                icon={<Sun className="w-5 h-5" />}
                label="Light"
              />
              <ThemeButton
                active={theme === "dark"}
                onClick={() => setTheme("dark")}
                icon={<Moon className="w-5 h-5" />}
                label="Dark"
              />
              <ThemeButton
                active={theme === "system"}
                onClick={() => setTheme("system")}
                icon={<Monitor className="w-5 h-5" />}
                label="System"
              />
            </div>
          </Card>
        </div>

        {/* Account Settings Section */}
        <div>
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide px-1 mb-3">
            Account Settings
          </h3>
          <Card className="divide-y divide-border">
            <SettingsRow
              icon={<User className="w-5 h-5 text-primary" />}
              label="Personal Information"
              onClick={() => {}}
            />
            <SettingsRow
              icon={<Shield className="w-5 h-5 text-success" />}
              label="Privacy & Security"
              onClick={() => {}}
            />
            <SettingsRow
              icon={<Bell className="w-5 h-5 text-warning" />}
              label="Notifications"
              onClick={() => {}}
            />
          </Card>
        </div>

        {/* Backup Section */}
        <div>
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide px-1 mb-3">
            Data & Backup
          </h3>
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-info-light flex items-center justify-center">
                  <CloudUpload className="w-5 h-5 text-info" />
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary">Google Drive Backup</h4>
                  <p className="text-xs text-text-secondary">Securely stored in your Drive</p>
                </div>
              </div>
              {isLoadingInfo ? (
                <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
              ) : backupInfo?.exists ? (
                <Badge variant="success" className="gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Synced
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Not backed up
                </Badge>
              )}
            </div>

            {backupInfo?.lastBackup && (
              <div className="flex items-center gap-2 text-xs text-text-secondary mb-4 pl-13">
                <Clock className="w-3.5 h-3.5" />
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
                {isBackingUp ? "Saving..." : "Backup"}
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
        </div>

        {/* Support Section */}
        <div>
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide px-1 mb-3">
            Support
          </h3>
          <Card className="divide-y divide-border">
            <SettingsRow
              icon={<HelpCircle className="w-5 h-5 text-text-muted" />}
              label="Help Center"
              onClick={() => {}}
            />
          </Card>
        </div>

        {/* Sign Out */}
        <Button
          variant="outline"
          className="w-full gap-2 text-error hover:text-error hover:bg-error-light border-error/30"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>

        {/* App Version */}
        <p className="text-center text-xs text-text-muted">BrainFood v0.1.0</p>
      </div>

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

// Settings row component matching Style A design
function SettingsRow({
  icon,
  label,
  onClick,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  value?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 hover:bg-background-secondary transition-colors duration-150 touch-manipulation"
    >
      <div className="w-10 h-10 rounded-full bg-background-secondary flex items-center justify-center shrink-0">
        {icon}
      </div>
      <span className="flex-1 text-left font-medium text-text-primary">{label}</span>
      {value && <span className="text-sm text-text-secondary">{value}</span>}
      <ChevronRight className="w-5 h-5 text-text-muted shrink-0" />
    </button>
  );
}

// Theme toggle button component
function ThemeButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all duration-150 ${
        active
          ? "border-primary bg-primary-light text-primary"
          : "border-border bg-surface text-text-secondary hover:border-primary/50"
      }`}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}
