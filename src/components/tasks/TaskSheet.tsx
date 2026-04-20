"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Target,
  Loader2,
  CheckCircle2,
  Trash2,
  RotateCcw,
  Clock,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Link as LinkIcon,
  FolderOpen,
  Flag,
  X,
} from "lucide-react";
import { PRIORITIES } from "@/lib/constants";
import { toast } from "sonner";
import { formatTime } from "@/lib/utils";
import type { Idea, Project } from "@/lib/db/schema";

interface TaskSheetProps {
  idea?: Idea;
  projectId?: string;
  projects?: Project[];
  trigger: React.ReactNode;
  onSuccess?: () => void;
}

export function TaskSheet({ idea, projectId, projects, trigger, onSuccess }: TaskSheetProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  // Form state
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

  // Reset form when drawer opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && idea) {
      setTitle(idea.title);
      setDescription(idea.description ?? "");
      setLinkUrl(idea.linkUrl ?? "");
      setPriority(idea.priority ?? undefined);
      setSelectedProjectId(idea.projectId ?? projectId ?? undefined);
    }
    setOpen(newOpen);
    setShowMoreOptions(false);
  };

  const handleScheduleForToday = async () => {
    if (!idea) return;

    setIsScheduling(true);
    try {
      const response = await fetch(`/api/ideas/${idea.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledForToday: new Date().toISOString(),
          ...(isCompleted && { status: "in-progress" }),
        }),
      });

      if (!response.ok) throw new Error("Failed to add to Focus");

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

  const handleRemoveFromFocus = async () => {
    if (!idea) return;

    setIsScheduling(true);
    try {
      const response = await fetch(`/api/ideas/${idea.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledForToday: null }),
      });

      if (!response.ok) throw new Error("Failed to remove from Focus");

      toast.success("Removed from Focus");
      setOpen(false);
      router.refresh();
      onSuccess?.();
    } catch {
      toast.error("Failed to remove from Focus");
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

      if (!response.ok) throw new Error("Failed to delete task");

      toast.success("Task deleted");
      setShowDeleteAlert(false);
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

      if (!response.ok) throw new Error("Failed to update status");

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

      if (selectedProjectId && selectedProjectId !== "none") {
        body.projectId = selectedProjectId;
      } else if (isEdit) {
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

      if (!isEdit) {
        setTitle("");
        setDescription("");
        setLinkUrl("");
        setPriority(undefined);
        setSelectedProjectId(undefined);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedProject = projects?.find((p) => p.id === selectedProjectId);
  const selectedPriority = PRIORITIES.find((p) => p.value === priority);

  return (
    <>
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent className="max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-2 pb-3 border-b border-border">
            <div className="flex items-center gap-3">
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 -ml-2">
                  <X className="w-5 h-5" />
                </Button>
              </DrawerClose>
              <h2 className="text-lg font-semibold text-text-primary">
                {isEdit ? "Edit Task" : "New Task"}
              </h2>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-1">
              {/* Time spent indicator */}
              {isEdit && idea.timeSpentSeconds > 0 && (
                <div className="flex items-center gap-1 text-xs text-text-muted px-2 py-1 bg-background-secondary rounded-full mr-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(idea.timeSpentSeconds)}
                </div>
              )}

              {/* More actions dropdown - only for existing tasks */}
              {isEdit && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {/* Focus actions */}
                    {isScheduledForToday ? (
                      <DropdownMenuItem
                        onClick={handleRemoveFromFocus}
                        disabled={isScheduling}
                        className="text-warning"
                      >
                        <Target className="w-4 h-4 mr-2" />
                        {isScheduling ? "Removing..." : "Remove from Focus"}
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={handleScheduleForToday}
                        disabled={isScheduling}
                        className="text-warning"
                      >
                        <Target className="w-4 h-4 mr-2" />
                        {isScheduling
                          ? "Adding..."
                          : isCompleted
                            ? "Reopen & Focus"
                            : "Add to Focus"}
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />

                    {/* Status actions */}
                    {!isCompleted ? (
                      <DropdownMenuItem
                        onClick={() => handleStatusChange("completed")}
                        disabled={isChangingStatus}
                        className="text-success"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        {isChangingStatus ? "Updating..." : "Mark Complete"}
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={() => handleStatusChange("in-progress")}
                        disabled={isChangingStatus}
                        className="text-primary"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        {isChangingStatus ? "Updating..." : "Reopen Task"}
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />

                    {/* Delete */}
                    <DropdownMenuItem
                      onClick={() => setShowDeleteAlert(true)}
                      className="text-error focus:text-error"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Task
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Form content */}
          <div className="px-4 py-4 space-y-4 overflow-y-auto flex-1">
            {/* Title - always visible */}
            <div className="space-y-1.5">
              <Input
                placeholder="What needs to be done?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                className="text-base font-medium h-12"
              />
            </div>

            {/* Description - always visible */}
            <div className="space-y-1.5">
              <Textarea
                placeholder="Add details or notes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="min-h-[80px] resize-none"
              />
            </div>

            {/* More Options - Collapsible */}
            <div className="border-t border-border pt-3">
              <button
                type="button"
                onClick={() => setShowMoreOptions(!showMoreOptions)}
                className="flex items-center justify-between w-full py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
              >
                <span>More options</span>
                {showMoreOptions ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {showMoreOptions && (
                <div className="space-y-3 pt-2 animate-fade-in">
                  {/* Project selector */}
                  {projects && projects.length > 0 && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-text-muted flex items-center gap-1.5">
                        <FolderOpen className="w-3.5 h-3.5" />
                        Project
                      </label>
                      <Select
                        value={selectedProjectId || "none"}
                        onValueChange={setSelectedProjectId}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="No project">
                            {selectedProject ? (
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{ backgroundColor: selectedProject.color }}
                                />
                                {selectedProject.name}
                              </div>
                            ) : (
                              "No project"
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No project</SelectItem>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-2.5 h-2.5 rounded-full"
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

                  {/* Priority selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-muted flex items-center gap-1.5">
                      <Flag className="w-3.5 h-3.5" />
                      Priority
                    </label>
                    <Select
                      value={priority || "none"}
                      onValueChange={(v) => setPriority(v === "none" ? undefined : v)}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="No priority">
                          {selectedPriority ? (
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: selectedPriority.color }}
                              />
                              {selectedPriority.label}
                            </div>
                          ) : (
                            "No priority"
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No priority</SelectItem>
                        {PRIORITIES.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: p.color }}
                              />
                              {p.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Link */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-muted flex items-center gap-1.5">
                      <LinkIcon className="w-3.5 h-3.5" />
                      Link
                    </label>
                    <Input
                      type="url"
                      placeholder="https://..."
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      className="h-10"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Focus indicator */}
            {isEdit && isScheduledForToday && !isCompleted && (
              <div className="flex items-center gap-2 text-sm text-warning bg-warning-light rounded-lg px-3 py-2">
                <Target className="w-4 h-4" />
                <span>In today&apos;s Focus</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <DrawerFooter className="border-t border-border">
            <Button onClick={handleSubmit} disabled={isLoading} className="h-11">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : isEdit ? (
                "Save Changes"
              ) : (
                "Create Task"
              )}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this task?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{idea?.title}&quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-error hover:bg-error/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
