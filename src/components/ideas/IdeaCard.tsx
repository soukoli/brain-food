"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IdeaSheet } from "./IdeaSheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2, ExternalLink, Clock, Target, CheckCircle2 } from "lucide-react";
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
      // Swipe left - delete
      setDeleteDialogOpen(true);
    } else if (info.offset.x > 100) {
      // Swipe right - schedule for today
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
        throw new Error("Failed to delete idea");
      }

      toast.success("Idea deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete idea");
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
        throw new Error("Failed to schedule idea");
      }

      toast.success("Added to Focus for today!");
      router.refresh();
      onSchedule?.();
    } catch {
      toast.error("Failed to schedule idea");
    } finally {
      setIsScheduling(false);
    }
  };

  const priorityInfo = idea.priority ? PRIORITIES.find((p) => p.value === idea.priority) : null;
  const isScheduled = !!idea.scheduledForToday;
  const isCompleted = idea.status === "completed";

  return (
    <>
      <div className="relative overflow-hidden rounded-xl">
        {/* Background indicators */}
        <motion.div
          className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none"
          style={{ background }}
        >
          <motion.div
            style={{ opacity: scheduleOpacity }}
            className="flex items-center gap-2 text-white"
          >
            <Target className="w-5 h-5" />
            <span className="font-medium">Focus</span>
          </motion.div>
          <motion.div
            style={{ opacity: deleteOpacity }}
            className="flex items-center gap-2 text-white"
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
          <IdeaSheet
            idea={idea}
            trigger={
              <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  {/* Project color indicator - larger and more prominent */}
                  <div
                    className="w-1.5 h-full min-h-[3rem] rounded-full shrink-0 self-stretch"
                    style={{
                      backgroundColor: idea.project?.color ?? "#94a3b8",
                    }}
                  />

                  <div className="flex-1 min-w-0">
                    {/* Title with priority badge - BOLD */}
                    <div className="flex items-start gap-2 flex-wrap">
                      <h3 className="font-bold text-base text-slate-900 dark:text-slate-50 break-words">
                        {idea.title}
                      </h3>
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
                        <Badge variant="default" className="shrink-0 bg-orange-500">
                          <Target className="w-3 h-3 mr-1" />
                          Focus
                        </Badge>
                      )}
                    </div>

                    {/* Description */}
                    {idea.description && (
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                        {idea.description}
                      </p>
                    )}

                    {/* Meta row */}
                    <div className="mt-2 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
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

                  {/* Quick Focus button */}
                  {showFocusButton && !isScheduled && !isCompleted && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="shrink-0 h-9 w-9 text-orange-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950"
                      onClick={handleScheduleForToday}
                      disabled={isScheduling}
                    >
                      <Target className="w-5 h-5" />
                    </Button>
                  )}
                  {isScheduled && !isCompleted && (
                    <div className="shrink-0 h-9 w-9 flex items-center justify-center text-orange-500">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
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
            <DialogTitle>Delete Idea</DialogTitle>
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
