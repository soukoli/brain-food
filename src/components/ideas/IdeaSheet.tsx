"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Target, Loader2, CheckCircle2, Trash2, RotateCcw, Play, Clock } from "lucide-react";
import { PRIORITIES } from "@/lib/constants";
import { toast } from "sonner";
import { formatTime } from "@/lib/utils";
import type { Idea, Project } from "@/lib/db/schema";

interface IdeaSheetProps {
  idea?: Idea;
  projectId?: string;
  projects?: Project[]; // Available projects for assignment
  trigger: React.ReactNode;
  onSuccess?: () => void;
}

export function IdeaSheet({ idea, projectId, projects, trigger, onSuccess }: IdeaSheetProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [title, setTitle] = useState(idea?.title ?? "");
  const [description, setDescription] = useState(idea?.description ?? "");
  const [linkUrl, setLinkUrl] = useState(idea?.linkUrl ?? "");
  const [priority, setPriority] = useState<string | undefined>(idea?.priority ?? undefined);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(
    idea?.projectId ?? projectId ?? undefined
  );

  const isEdit = !!idea;
  const isScheduledForToday = !!idea?.scheduledForToday;
  const isCompleted = idea?.status === "completed";
  const isInProgress = idea?.status === "in-progress";
  const hasNoProject = isEdit && !idea?.projectId;

  const handleScheduleForToday = async () => {
    if (!idea) return;

    setIsScheduling(true);
    try {
      const response = await fetch(`/api/ideas/${idea.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledForToday: new Date().toISOString(),
          // If completed, also reopen it
          ...(isCompleted && { status: "in-progress" }),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add to Focus");
      }

      toast.success(isCompleted ? "Reopened and added to Focus!" : "Added to Focus!");
      setOpen(false);
      router.refresh();
      onSuccess?.();
    } catch {
      toast.error("Failed to add to Focus");
    } finally {
      setIsScheduling(false);
    }
  };

  const handleDelete = async () => {
    if (!idea) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/ideas/${idea.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete task");
      }

      toast.success("Task deleted");
      setOpen(false);
      router.refresh();
      onSuccess?.();
    } catch {
      toast.error("Failed to delete task");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (newStatus: "in-progress" | "completed") => {
    if (!idea) return;

    setIsChangingStatus(true);
    try {
      const response = await fetch(`/api/ideas/${idea.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      toast.success(newStatus === "completed" ? "Marked as complete!" : "Reopened!");
      setOpen(false);
      router.refresh();
      onSuccess?.();
    } catch {
      toast.error("Failed to update status");
    } finally {
      setIsChangingStatus(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    setIsLoading(true);

    try {
      const url = isEdit ? `/api/ideas/${idea.id}` : "/api/ideas";
      const method = isEdit ? "PATCH" : "POST";

      const body: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim() || null,
        linkUrl: linkUrl.trim() || null,
        priority: priority || null,
      };

      // Include projectId for both create and edit
      if (selectedProjectId && selectedProjectId !== "none") {
        body.projectId = selectedProjectId;
      } else if (isEdit) {
        // Allow removing project assignment
        body.projectId = null;
      } else if (!isEdit && projectId) {
        body.projectId = projectId;
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save task");
      }

      toast.success(isEdit ? "Task updated" : "Task created");
      setOpen(false);
      router.refresh();
      onSuccess?.();

      // Reset form for new ideas
      if (!isEdit) {
        setTitle("");
        setDescription("");
        setLinkUrl("");
        setPriority(undefined);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <div className="flex items-center justify-between">
            <div>
              <DrawerTitle className="font-bold">{isEdit ? "Edit Idea" : "New Idea"}</DrawerTitle>
              <DrawerDescription>
                {isEdit ? "Update your idea" : "Capture a new idea"}
              </DrawerDescription>
            </div>
            {/* Status badge for existing ideas */}
            {isEdit && (
              <Badge
                variant={isCompleted ? "success" : isInProgress ? "default" : "secondary"}
                className={isInProgress ? "bg-blue-500" : ""}
              >
                {isCompleted ? "Completed" : isInProgress ? "In Progress" : "Inbox"}
              </Badge>
            )}
          </div>
        </DrawerHeader>

        <div className="px-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Time spent indicator for existing ideas */}
          {isEdit && idea.timeSpentSeconds > 0 && (
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2">
              <Clock className="w-4 h-4" />
              <span>
                Time spent: <strong>{formatTime(idea.timeSpentSeconds)}</strong>
              </span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Title *
            </label>
            <Input
              placeholder="What's your task?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              className="font-bold text-base"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Description (optional)
            </label>
            <Textarea
              placeholder="Add more details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Link (optional)
            </label>
            <Input
              type="url"
              placeholder="https://..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Priority (optional)
            </label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                      {p.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Project selector - show for orphan ideas or when projects are provided */}
          {isEdit && (hasNoProject || projects) && projects && projects.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Project {hasNoProject && <span className="text-orange-500">(Not assigned)</span>}
              </label>
              <Select value={selectedProjectId || "none"} onValueChange={setSelectedProjectId}>
                <SelectTrigger
                  className={hasNoProject ? "border-orange-300 dark:border-orange-700" : ""}
                >
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No project</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: project.color }}
                        />
                        {project.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Quick Actions for existing ideas */}
          {isEdit && (
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Quick Actions
              </label>

              <div className="grid grid-cols-2 gap-2">
                {/* Add to Focus / Reopen & Focus */}
                {!isScheduledForToday && (
                  <Button
                    variant="outline"
                    className="h-auto py-3 flex-col gap-1 border-orange-200 hover:bg-orange-50 hover:border-orange-400 dark:border-orange-800 dark:hover:bg-orange-950"
                    onClick={handleScheduleForToday}
                    disabled={isScheduling}
                  >
                    {isScheduling ? (
                      <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                    ) : (
                      <Target className="w-5 h-5 text-orange-500" />
                    )}
                    <span className="text-xs text-orange-600 dark:text-orange-400">
                      {isCompleted ? "Reopen & Focus" : "Add to Focus"}
                    </span>
                  </Button>
                )}

                {/* Mark Complete (if not completed) */}
                {!isCompleted && (
                  <Button
                    variant="outline"
                    className="h-auto py-3 flex-col gap-1 border-green-200 hover:bg-green-50 hover:border-green-400 dark:border-green-800 dark:hover:bg-green-950"
                    onClick={() => handleStatusChange("completed")}
                    disabled={isChangingStatus}
                  >
                    {isChangingStatus ? (
                      <Loader2 className="w-5 h-5 animate-spin text-green-500" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    )}
                    <span className="text-xs text-green-600 dark:text-green-400">
                      Mark Complete
                    </span>
                  </Button>
                )}

                {/* Reopen (if completed and already in focus) */}
                {isCompleted && isScheduledForToday && (
                  <Button
                    variant="outline"
                    className="h-auto py-3 flex-col gap-1 border-blue-200 hover:bg-blue-50 hover:border-blue-400 dark:border-blue-800 dark:hover:bg-blue-950"
                    onClick={() => handleStatusChange("in-progress")}
                    disabled={isChangingStatus}
                  >
                    {isChangingStatus ? (
                      <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                    ) : (
                      <RotateCcw className="w-5 h-5 text-blue-500" />
                    )}
                    <span className="text-xs text-blue-600 dark:text-blue-400">Reopen</span>
                  </Button>
                )}

                {/* Start Working (if in inbox) */}
                {!isCompleted && !isInProgress && (
                  <Button
                    variant="outline"
                    className="h-auto py-3 flex-col gap-1 border-blue-200 hover:bg-blue-50 hover:border-blue-400 dark:border-blue-800 dark:hover:bg-blue-950"
                    onClick={() => handleStatusChange("in-progress")}
                    disabled={isChangingStatus}
                  >
                    {isChangingStatus ? (
                      <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                    ) : (
                      <Play className="w-5 h-5 text-blue-500" />
                    )}
                    <span className="text-xs text-blue-600 dark:text-blue-400">Start Working</span>
                  </Button>
                )}

                {/* Delete - with confirmation */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-auto py-3 flex-col gap-1 border-red-200 hover:bg-red-50 hover:border-red-400 dark:border-red-800 dark:hover:bg-red-950"
                    >
                      <Trash2 className="w-5 h-5 text-red-500" />
                      <span className="text-xs text-red-600 dark:text-red-400">Delete</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this task?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete &quot;{idea.title}&quot;. This action cannot be
                        undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-red-600 hover:bg-red-700"
                        disabled={isDeleting}
                      >
                        {isDeleting ? "Deleting..." : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              {/* Already in Focus indicator */}
              {isScheduledForToday && !isCompleted && (
                <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950 rounded-lg px-3 py-2">
                  <Target className="w-4 h-4" />
                  <span>This idea is in today&apos;s Focus</span>
                </div>
              )}
            </div>
          )}
        </div>

        <DrawerFooter>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Saving..." : isEdit ? "Save Changes" : "Create Idea"}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
