"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Clock, Trash2, MoreVertical, Pin } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { IdeaWithProject } from "@/types";

interface TaskListItemProps {
  task: IdeaWithProject;
  showProject?: boolean;
  showTime?: boolean;
  showActions?: boolean;
  onStartFocus?: (task: IdeaWithProject) => void;
  onDelete?: (task: IdeaWithProject) => void;
  onPin?: (task: IdeaWithProject) => void;
  isPinned?: boolean;
  compact?: boolean;
}

// Format time as "Xh Ym" or "Xm" or "0m"
function formatTimeShort(seconds: number): string {
  if (seconds < 60) return "0m";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${minutes}m`;
}

export function TaskListItem({
  task,
  showProject = true,
  showTime = true,
  showActions = true,
  onStartFocus,
  onDelete,
  onPin,
  isPinned = false,
  compact = false,
}: TaskListItemProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const isCompleted = task.status === "completed";
  const projectColor = task.project?.color ?? "#94a3b8";

  const handleClick = () => {
    // Navigate to project page with this task, or to inbox if no project
    if (task.projectId) {
      router.push(`/projects/${task.projectId}?task=${task.id}`);
    } else {
      router.push(`/projects?tab=inbox&task=${task.id}`);
    }
  };

  const handleStartFocus = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStartFocus?.(task);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(task);
      return;
    }

    // Default delete behavior
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/ideas/${task.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete task");
      }

      toast.success("Task deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete task");
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPin?.(task);
  };

  return (
    <Card
      className={cn(
        "group relative overflow-hidden cursor-pointer transition-all hover:shadow-md",
        isCompleted && "opacity-60",
        compact ? "p-2.5" : "p-3"
      )}
      onClick={handleClick}
    >
      {/* Color accent bar on left */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
        style={{ backgroundColor: projectColor }}
      />

      <div className={cn("flex items-center gap-3", compact ? "pl-2" : "pl-3")}>
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {/* Pin indicator */}
            {isPinned && <Pin className="w-3 h-3 text-warning shrink-0" />}

            {/* Title */}
            <p
              className={cn(
                "font-medium text-text-primary truncate",
                compact ? "text-sm" : "text-sm",
                isCompleted && "line-through"
              )}
            >
              {task.title}
            </p>
          </div>

          {/* Description - only if not compact and has description */}
          {!compact && task.description && (
            <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">{task.description}</p>
          )}

          {/* Meta row: project + time */}
          <div className="flex items-center gap-2 mt-1">
            {showProject && task.project && (
              <span className="text-xs font-medium" style={{ color: projectColor }}>
                {task.project.name}
              </span>
            )}

            {showTime && task.timeSpentSeconds > 0 && (
              <span className="text-xs text-text-muted flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTimeShort(task.timeSpentSeconds)}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center gap-1 shrink-0">
            {/* Start Focus button */}
            {!isCompleted && onStartFocus && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-lg bg-primary-light text-primary hover:bg-primary hover:text-white"
                onClick={handleStartFocus}
              >
                <Play className="w-3.5 h-3.5 ml-0.5" />
              </Button>
            )}

            {/* More actions dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="w-4 h-4 text-text-muted" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onPin && (
                  <DropdownMenuItem onClick={handlePin}>
                    <Pin className="w-4 h-4 mr-2" />
                    {isPinned ? "Unpin" : "Pin to top"}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-error focus:text-error"
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {isDeleting ? "Deleting..." : "Delete"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </Card>
  );
}
