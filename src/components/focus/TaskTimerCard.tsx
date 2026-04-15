"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useTimer } from "@/hooks/useTimer";
import { Play, Pause, Check, Clock, Lightbulb } from "lucide-react";
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
        toast.success("Task completed!", {
          action: {
            label: "Undo",
            onClick: handleUndoComplete,
          },
          duration: 5000,
        });
      }

      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
      setIsRunning(idea.isTimerRunning);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleTimer = () => {
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
        isRunning && "ring-2 ring-warning shadow-elevated",
        isOverThreshold && isRunning && "ring-error bg-error-light"
      )}
    >
      <div className="flex items-start gap-4">
        {/* Icon with project color */}
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: (idea.project?.color ?? "#94a3b8") + "20" }}
        >
          <Lightbulb className="w-6 h-6" style={{ color: idea.project?.color ?? "#94a3b8" }} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="font-semibold text-text-primary">{idea.title}</h3>

          {/* Project name with color */}
          {idea.project && (
            <p className="text-xs font-medium mt-0.5" style={{ color: idea.project.color }}>
              {idea.project.name}
            </p>
          )}

          {/* Timer display */}
          <div className="mt-3 flex items-center gap-3">
            <div
              className={cn(
                "text-2xl font-mono font-bold",
                isRunning && "animate-pulse",
                isOverThreshold ? "text-error" : isRunning ? "text-warning" : "text-text-primary"
              )}
            >
              {formattedTime}
            </div>
            {isRunning && (
              <Badge variant={isOverThreshold ? "destructive" : "warning"}>
                <Clock className="w-3 h-3 mr-1" />
                {isOverThreshold ? "Over time!" : "Active"}
              </Badge>
            )}
          </div>

          {/* Progress bar */}
          <div className="mt-2">
            <Progress
              value={warningProgress}
              className={cn("h-1.5", isOverThreshold ? "[&>div]:bg-error" : "[&>div]:bg-warning")}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2 shrink-0">
          <Button
            size="icon"
            variant={isRunning ? "secondary" : "warning"}
            onClick={handleToggleTimer}
            disabled={isUpdating}
            className="h-12 w-12 rounded-full"
          >
            {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={handleComplete}
            disabled={isUpdating}
            className="h-12 w-12 rounded-full text-success hover:text-success hover:bg-success-light border-success/30"
          >
            <Check className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
