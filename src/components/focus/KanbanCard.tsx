"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Clock,
  Lightbulb,
  Play,
  Pause,
  GripVertical,
  Check,
  Trash2,
  Link as LinkIcon,
  X,
} from "lucide-react";
import { formatTime } from "@/lib/utils";
import { toast } from "sonner";
import type { IdeaWithProject } from "@/types";
import type { Project } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

interface KanbanCardProps {
  task: IdeaWithProject;
  projects?: Project[];
  onTimerToggle?: (task: IdeaWithProject) => void;
  isTimerLoading?: boolean;
  onTaskUpdate?: () => void;
}

export function KanbanCard({
  task,
  projects = [],
  onTimerToggle,
  isTimerLoading,
  onTaskUpdate,
}: KanbanCardProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [linkUrl, setLinkUrl] = useState(task.linkUrl ?? "");
  const [projectId, setProjectId] = useState(task.projectId ?? "none");

  const cardRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: isExpanded, // Disable drag when editing
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Focus title input when expanded
  useEffect(() => {
    if (isExpanded && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isExpanded]);

  // Close on click outside
  useEffect(() => {
    if (!isExpanded) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        handleSave();
      }
    };

    // Delay to prevent immediate close
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isExpanded]);

  // Handle escape key
  useEffect(() => {
    if (!isExpanded) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleSave();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isExpanded, title, description, linkUrl, projectId]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      titleInputRef.current?.focus();
      return;
    }

    // Check if anything changed
    const hasChanges =
      title !== task.title ||
      description !== (task.description ?? "") ||
      linkUrl !== (task.linkUrl ?? "") ||
      projectId !== (task.projectId ?? "none");

    if (!hasChanges) {
      setIsExpanded(false);
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/ideas/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          linkUrl: linkUrl.trim() || null,
          projectId: projectId === "none" ? null : projectId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save");
      }

      setIsExpanded(false);
      router.refresh();
      onTaskUpdate?.();
    } catch {
      toast.error("Failed to save task");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/ideas/${task.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete");
      }

      toast.success("Task deleted");
      router.refresh();
      onTaskUpdate?.();
    } catch {
      toast.error("Failed to delete task");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMarkComplete = async () => {
    setIsSaving(true);
    try {
      const newStatus = task.status === "completed" ? "in-progress" : "completed";
      const response = await fetch(`/api/ideas/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          ...(newStatus === "completed" && { completedAt: new Date().toISOString() }),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      toast.success(newStatus === "completed" ? "Marked complete!" : "Reopened!");
      setIsExpanded(false);
      router.refresh();
      onTaskUpdate?.();
    } catch {
      toast.error("Failed to update task");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't expand if clicking on drag handle or buttons
    if ((e.target as HTMLElement).closest("[data-drag-handle]")) return;
    if ((e.target as HTMLElement).closest("button")) return;

    if (!isExpanded) {
      setIsExpanded(true);
    }
  };

  // Collapsed card view
  if (!isExpanded) {
    return (
      <Card
        ref={setNodeRef}
        style={style}
        onClick={handleCardClick}
        className={cn(
          "p-3 cursor-pointer transition-all",
          "hover:shadow-md hover:scale-[1.01]",
          isDragging && "opacity-50 shadow-lg rotate-2"
        )}
      >
        <div className="flex items-start gap-2">
          {/* Drag handle */}
          <div
            data-drag-handle
            {...attributes}
            {...listeners}
            className="mt-1 p-1 -ml-1 cursor-grab active:cursor-grabbing text-text-muted hover:text-text-secondary rounded"
          >
            <GripVertical className="w-4 h-4" />
          </div>

          {/* Project color indicator */}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: (task.project?.color ?? "#94a3b8") + "20" }}
          >
            <Lightbulb className="w-4 h-4" style={{ color: task.project?.color ?? "#94a3b8" }} />
          </div>

          <div className="flex-1 min-w-0">
            {/* Title */}
            <p className="font-medium text-text-primary text-sm leading-tight line-clamp-2">
              {task.title}
            </p>

            {/* Project name */}
            {task.project && (
              <p className="text-xs font-medium mt-1" style={{ color: task.project.color }}>
                {task.project.name}
              </p>
            )}

            {/* Time & Timer */}
            <div className="flex items-center justify-between mt-2">
              {task.timeSpentSeconds > 0 && (
                <Badge variant="outline" className="text-xs h-5">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatTime(task.timeSpentSeconds)}
                </Badge>
              )}

              {/* Timer button for in-progress tasks */}
              {task.status === "in-progress" && onTimerToggle && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTimerToggle(task);
                  }}
                  disabled={isTimerLoading}
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center transition-colors",
                    task.isTimerRunning
                      ? "bg-warning text-white"
                      : "bg-success-light text-success hover:bg-success hover:text-white"
                  )}
                >
                  {task.isTimerRunning ? (
                    <Pause className="w-3.5 h-3.5" />
                  ) : (
                    <Play className="w-3.5 h-3.5 ml-0.5" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Expanded card view with edit fields
  return (
    <motion.div
      ref={cardRef}
      initial={{ scale: 1 }}
      animate={{ scale: 1.02 }}
      transition={{ duration: 0.15 }}
    >
      <Card className="p-3 shadow-lg ring-2 ring-primary/20">
        <div className="flex items-start gap-2">
          {/* Drag handle (disabled when editing) */}
          <div className="mt-1 p-1 -ml-1 text-text-muted/50 cursor-not-allowed">
            <GripVertical className="w-4 h-4" />
          </div>

          <div className="flex-1 min-w-0 space-y-3">
            {/* Title input */}
            <Input
              ref={titleInputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title..."
              className="font-medium text-sm h-8"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSave();
                }
              }}
            />

            {/* Description */}
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              className="text-sm min-h-[60px] resize-none"
              rows={2}
            />

            {/* Link */}
            <div className="relative">
              <LinkIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
                className="text-sm h-8 pl-8"
                type="url"
              />
            </div>

            {/* Project selector */}
            {projects.length > 0 && (
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Select project" />
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
            )}

            {/* Actions row */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              {/* Left: Time spent */}
              {task.timeSpentSeconds > 0 && (
                <Badge variant="outline" className="text-xs h-6">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatTime(task.timeSpentSeconds)}
                </Badge>
              )}

              {/* Right: Action buttons */}
              <div className="flex items-center gap-1 ml-auto">
                {/* Mark complete */}
                <Button
                  size="sm"
                  variant={task.status === "completed" ? "outline" : "default"}
                  className={cn(
                    "h-7 text-xs gap-1",
                    task.status !== "completed" && "bg-success hover:bg-success/90"
                  )}
                  onClick={handleMarkComplete}
                  disabled={isSaving}
                >
                  <Check className="w-3 h-3" />
                  {task.status === "completed" ? "Reopen" : "Done"}
                </Button>

                {/* Delete */}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-error hover:text-error hover:bg-error/10"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>

                {/* Close/Save */}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
