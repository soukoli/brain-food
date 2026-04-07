"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useTimer } from "@/hooks/useTimer";
import { Play, Pause, Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { IdeaWithProject } from "@/types";

interface TaskTimerCardProps {
  idea: IdeaWithProject;
}

export function TaskTimerCard({ idea }: TaskTimerCardProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  // Calculate initial seconds including elapsed time if timer was running
  const getInitialSeconds = () => {
    let total = idea.timeSpentSeconds;
    if (idea.isTimerRunning && idea.lastTimerStartedAt) {
      const elapsed = Math.floor((Date.now() - new Date(idea.lastTimerStartedAt).getTime()) / 1000);
      total += elapsed;
    }
    return total;
  };

  const { seconds, isRunning, formattedTime, setIsRunning, setSeconds } = useTimer({
    initialSeconds: getInitialSeconds(),
    isRunning: idea.isTimerRunning,
  });

  // Sync with server state
  useEffect(() => {
    // Calculate initial seconds including elapsed time if timer was running
    let total = idea.timeSpentSeconds;
    if (idea.isTimerRunning && idea.lastTimerStartedAt) {
      const elapsed = Math.floor((Date.now() - new Date(idea.lastTimerStartedAt).getTime()) / 1000);
      total += elapsed;
    }
    setSeconds(total);
    setIsRunning(idea.isTimerRunning);
  }, [
    idea.timeSpentSeconds,
    idea.isTimerRunning,
    idea.lastTimerStartedAt,
    setSeconds,
    setIsRunning,
  ]);

  const handleUndoComplete = async () => {
    try {
      const response = await fetch(`/api/ideas/${idea.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "in-progress" }),
      });

      if (!response.ok) {
        throw new Error("Failed to undo");
      }

      toast.success("Task reopened");
      router.refresh();
    } catch {
      toast.error("Failed to undo completion");
    }
  };

  const handleTimerAction = async (action: "start" | "pause" | "complete") => {
    setIsUpdating(true);

    try {
      const response = await fetch(`/api/ideas/${idea.id}/timer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to ${action} timer`);
      }

      if (action === "complete") {
        // Show toast with Undo button for accidental completions
        toast.success("Task completed!", {
          action: {
            label: "Undo",
            onClick: handleUndoComplete,
          },
          duration: 5000, // 5 seconds to undo
        });
      }

      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
      // Revert optimistic update
      setIsRunning(idea.isTimerRunning);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleTimer = () => {
    // Optimistic update
    setIsRunning(!isRunning);
    handleTimerAction(isRunning ? "pause" : "start");
  };

  const handleComplete = () => {
    handleTimerAction("complete");
  };

  // Warning threshold progress
  const warningProgress = Math.min((seconds / idea.focusWarningThreshold) * 100, 100);
  const isOverThreshold = seconds >= idea.focusWarningThreshold;

  return (
    <Card
      className={cn(
        "p-4 transition-all duration-200",
        isRunning && "ring-2 ring-orange-500 shadow-lg",
        isOverThreshold && isRunning && "ring-red-500 bg-red-50 dark:bg-red-950/20"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Project color bar */}
        <div
          className="w-1.5 h-full min-h-[4rem] rounded-full shrink-0 self-stretch"
          style={{ backgroundColor: idea.project?.color ?? "#94a3b8" }}
        />

        <div className="flex-1 min-w-0">
          {/* Title - BOLD */}
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-50">{idea.title}</h3>

          {/* Description */}
          {idea.description && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 line-clamp-1">
              {idea.description}
            </p>
          )}

          {/* Project name with color */}
          {idea.project && (
            <p className="mt-1 text-xs font-medium" style={{ color: idea.project.color }}>
              {idea.project.name}
            </p>
          )}

          {/* Timer display */}
          <div className="mt-3 flex items-center gap-3">
            <div
              className={cn(
                "text-2xl font-mono font-bold",
                isRunning && "timer-running",
                isOverThreshold
                  ? "text-red-600"
                  : isRunning
                    ? "text-orange-600"
                    : "text-slate-900 dark:text-slate-50"
              )}
            >
              {formattedTime}
            </div>
            {isRunning && (
              <Badge
                variant={isOverThreshold ? "destructive" : "default"}
                className={cn(!isOverThreshold && "bg-orange-500")}
              >
                <Clock className="w-3 h-3 mr-1" />
                {isOverThreshold ? "Over time!" : "Active"}
              </Badge>
            )}
          </div>

          {/* Progress bar */}
          <div className="mt-2">
            <Progress
              value={warningProgress}
              className={cn(
                "h-1.5",
                isOverThreshold ? "[&>div]:bg-red-500" : "[&>div]:bg-orange-500"
              )}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2 shrink-0">
          <Button
            size="icon"
            variant={isRunning ? "secondary" : "default"}
            onClick={handleToggleTimer}
            disabled={isUpdating}
            className={cn(
              "h-12 w-12 rounded-full",
              !isRunning && "bg-orange-500 hover:bg-orange-600",
              isRunning &&
                "bg-orange-100 hover:bg-orange-200 dark:bg-orange-900 dark:hover:bg-orange-800"
            )}
          >
            {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={handleComplete}
            disabled={isUpdating}
            className="h-12 w-12 rounded-full text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900 border-green-200"
          >
            <Check className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
