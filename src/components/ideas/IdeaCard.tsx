"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TaskSheet } from "@/components/tasks/TaskSheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Trash2,
  ExternalLink,
  Clock,
  Target,
  CheckCircle2,
  Lightbulb,
  ChevronRight,
} from "lucide-react";
import { formatTime, formatRelativeTime } from "@/lib/utils";
import { PRIORITIES } from "@/lib/constants";
import { toast } from "sonner";
import type { IdeaWithProject } from "@/types";

interface IdeaCardProps {
  idea: IdeaWithProject;
  showProject?: boolean;
  onSchedule?: () => void;
  showFocusButton?: boolean;
}

export function IdeaCard({
  idea,
  showProject = true,
  onSchedule,
  showFocusButton = true,
}: IdeaCardProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);

  const x = useMotionValue(0);
  const background = useTransform(x, [-150, 0, 150], ["#EF4444", "#ffffff", "#22C55E"]);
  const deleteOpacity = useTransform(x, [-150, -50, 0], [1, 0.5, 0]);
  const scheduleOpacity = useTransform(x, [0, 50, 150], [0, 0.5, 1]);

  const handleDragEnd = async (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -100) {
      setDeleteDialogOpen(true);
    } else if (info.offset.x > 100) {
      await handleScheduleForToday();
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/ideas/${idea.id}`, {
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
      setDeleteDialogOpen(false);
    }
  };

  const handleScheduleForToday = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();

    if (idea.scheduledForToday) {
      toast.info("Already scheduled for today");
      return;
    }

    setIsScheduling(true);
    try {
      const response = await fetch(`/api/ideas/${idea.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledForToday: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to schedule task");
      }

      toast.success("Added to Focus for today!");
      router.refresh();
      onSchedule?.();
    } catch {
      toast.error("Failed to schedule task");
    } finally {
      setIsScheduling(false);
    }
  };

  const priorityInfo = idea.priority ? PRIORITIES.find((p) => p.value === idea.priority) : null;
  const isScheduled = !!idea.scheduledForToday;
  const isCompleted = idea.status === "completed";

  return (
    <>
      <div className="relative overflow-hidden rounded-lg">
        {/* Background indicators */}
        <motion.div
          className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none"
          style={{ background }}
        >
          <motion.div
            style={{ opacity: scheduleOpacity }}
            className="flex items-center gap-2 text-text-inverse"
          >
            <Target className="w-5 h-5" />
            <span className="font-medium">Focus</span>
          </motion.div>
          <motion.div
            style={{ opacity: deleteOpacity }}
            className="flex items-center gap-2 text-text-inverse"
          >
            <span className="font-medium">Delete</span>
            <Trash2 className="w-5 h-5" />
          </motion.div>
        </motion.div>

        {/* Card content */}
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.3}
          onDragEnd={handleDragEnd}
          style={{ x }}
          whileDrag={{ cursor: "grabbing" }}
        >
          <TaskSheet
            idea={idea}
            trigger={
              <Card className="p-4 cursor-pointer">
                <div className="flex items-center gap-4">
                  {/* Icon with project color */}
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: (idea.project?.color ?? "#94a3b8") + "20",
                    }}
                  >
                    <Lightbulb
                      className="w-6 h-6"
                      style={{ color: idea.project?.color ?? "#94a3b8" }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Title with badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-text-primary truncate">{idea.title}</h3>
                      {priorityInfo && (
                        <Badge
                          variant={
                            idea.priority === "urgent"
                              ? "destructive"
                              : idea.priority === "high"
                                ? "warning"
                                : "secondary"
                          }
                          className="shrink-0"
                        >
                          {priorityInfo.label}
                        </Badge>
                      )}
                      {isScheduled && !isCompleted && (
                        <Badge variant="default" className="shrink-0 bg-warning text-text-inverse">
                          Focus
                        </Badge>
                      )}
                    </div>

                    {/* Meta row */}
                    <div className="mt-1 flex items-center gap-3 text-xs text-text-secondary">
                      {showProject && idea.project && (
                        <span className="font-medium" style={{ color: idea.project.color }}>
                          {idea.project.name}
                        </span>
                      )}
                      {idea.linkUrl && <ExternalLink className="w-3 h-3" />}
                      {idea.timeSpentSeconds > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(idea.timeSpentSeconds)}
                        </span>
                      )}
                      <span>{formatRelativeTime(new Date(idea.createdAt))}</span>
                    </div>
                  </div>

                  {/* Right side action/indicator */}
                  {showFocusButton && !isScheduled && !isCompleted ? (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="shrink-0 h-10 w-10 text-warning hover:text-warning hover:bg-warning-light"
                      onClick={handleScheduleForToday}
                      disabled={isScheduling}
                    >
                      <Target className="w-5 h-5" />
                    </Button>
                  ) : isScheduled && !isCompleted ? (
                    <div className="shrink-0 h-10 w-10 flex items-center justify-center text-warning">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  ) : (
                    <ChevronRight className="w-5 h-5 text-text-muted shrink-0" />
                  )}
                </div>
              </Card>
            }
          />
        </motion.div>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{idea.title}&quot;? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
