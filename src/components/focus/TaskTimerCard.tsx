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
      const elapsed = Math.floor(
        (Date.now() - new Date(idea.lastTimerStartedAt).getTime()) / 1000
      );
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
    setSeconds(getInitialSeconds());
    setIsRunning(idea.isTimerRunning);
  }, [idea.timeSpentSeconds, idea.isTimerRunning, idea.lastTimerStartedAt]);

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
        toast.success("Task completed!");
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
  const warningProgress = Math.min(
    (seconds / idea.focusWarningThreshold) * 100,
    100
  );
  const isOverThreshold = seconds >= idea.focusWarningThreshold;

  return (
    <Card
      className={cn(
        "p-4 transition-all duration-200",
        isRunning && "ring-2 ring-blue-500 shadow-lg",
        isOverThreshold && isRunning && "ring-orange-500"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Project color */}
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0 mt-1.5"
          style={{ backgroundColor: idea.project?.color ?? "#94a3b8" }}
        />

        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="font-semibold text-slate-900 dark:text-slate-50">
            {idea.title}
          </h3>

          {/* Description */}
          {idea.description && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 line-clamp-1">
              {idea.description}
            </p>
          )}

          {/* Project name */}
          {idea.project && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {idea.project.name}
            </p>
          )}

          {/* Timer display */}
          <div className="mt-3 flex items-center gap-3">
            <div
              className={cn(
                "text-2xl font-mono font-bold",
                isRunning && "timer-running",
                isOverThreshold ? "text-orange-600" : "text-slate-900 dark:text-slate-50"
              )}
            >
              {formattedTime}
            </div>
            {isRunning && (
              <Badge variant={isOverThreshold ? "warning" : "default"}>
                <Clock className="w-3 h-3 mr-1" />
                Active
              </Badge>
            )}
          </div>

          {/* Progress bar */}
          <div className="mt-2">
            <Progress
              value={warningProgress}
              className={cn(
                "h-1",
                isOverThreshold && "[&>div]:bg-orange-500"
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
              isRunning && "bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800"
            )}
          >
            {isRunning ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={handleComplete}
            disabled={isUpdating}
            className="h-12 w-12 rounded-full text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900"
          >
            <Check className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
