"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { TaskTimerCard } from "@/components/focus/TaskTimerCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target, CheckCircle2, Clock, ArrowRight, Zap, RotateCcw, Lightbulb } from "lucide-react";
import { formatTime } from "@/lib/utils";
import { toast } from "sonner";
import type { IdeaWithProject } from "@/types";

interface FocusClientProps {
  activeTasks: IdeaWithProject[];
  completedToday: IdeaWithProject[];
}

export function FocusClient({ activeTasks, completedToday }: FocusClientProps) {
  const router = useRouter();
  const [reopeningId, setReopeningId] = useState<string | null>(null);

  const handleReopenTask = async (task: IdeaWithProject) => {
    setReopeningId(task.id);
    try {
      const response = await fetch(`/api/ideas/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "in-progress",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to reopen task");
      }

      toast.success("Task reopened");
      router.refresh();
    } catch {
      toast.error("Failed to reopen task");
    } finally {
      setReopeningId(null);
    }
  };

  const totalTimeToday = completedToday.reduce((acc, idea) => acc + idea.timeSpentSeconds, 0);
  const runningTask = activeTasks.find((task) => task.isTimerRunning);

  return (
    <>
      <PageHeader
        title="Focus"
        right={
          runningTask && (
            <Badge variant="default" className="animate-pulse bg-warning text-text-inverse">
              <Clock className="w-3 h-3 mr-1" />
              Active
            </Badge>
          )
        }
      />

      <div className="px-4 space-y-4">
        {/* Stats summary */}
        <Card className="p-5 bg-gradient-to-r from-warning-light to-primary-light border-none">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Today&apos;s Focus</p>
              <p className="text-2xl font-bold text-warning">{activeTasks.length} tasks</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-text-secondary">Time Logged</p>
              <p className="text-2xl font-bold text-success">{formatTime(totalTimeToday)}</p>
            </div>
          </div>
        </Card>

        {/* Active tasks */}
        {activeTasks.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-warning-light flex items-center justify-center">
              <Target className="h-8 w-8 text-warning" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">No tasks in Focus</h3>
            <p className="text-text-secondary mb-6">
              Add ideas to Focus to start tracking your progress
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/capture">
                <Button variant="outline">
                  <Zap className="w-4 h-4 mr-2" />
                  Capture New
                </Button>
              </Link>
              <Link href="/projects">
                <Button variant="warning">
                  Browse Ideas
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div>
            <h2 className="text-base font-semibold text-text-primary mb-3">Active Tasks</h2>
            <div className="space-y-3">
              {activeTasks.map((task) => (
                <TaskTimerCard key={task.id} idea={task} />
              ))}
            </div>
          </div>
        )}

        {/* Completed today */}
        {completedToday.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-success" />
              <h2 className="text-base font-semibold text-text-primary">
                Completed Today ({completedToday.length})
              </h2>
            </div>
            <Card className="divide-y divide-border">
              {completedToday.map((task) => {
                const isReopening = reopeningId === task.id;
                return (
                  <div key={task.id} className="flex items-center gap-4 p-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: (task.project?.color ?? "#94a3b8") + "20" }}
                    >
                      <Lightbulb
                        className="w-5 h-5"
                        style={{ color: task.project?.color ?? "#94a3b8" }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-text-primary truncate">{task.title}</p>
                      {task.project && (
                        <p className="text-xs font-medium" style={{ color: task.project.color }}>
                          {task.project.name}
                        </p>
                      )}
                    </div>
                    <Badge variant="success" className="shrink-0">
                      {formatTime(task.timeSpentSeconds)}
                    </Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 text-text-muted hover:text-warning hover:bg-warning-light"
                      onClick={() => handleReopenTask(task)}
                      disabled={isReopening}
                      title="Reopen task"
                    >
                      <RotateCcw className={`w-4 h-4 ${isReopening ? "animate-spin" : ""}`} />
                    </Button>
                  </div>
                );
              })}
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
