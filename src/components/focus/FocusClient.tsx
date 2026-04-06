"use client";

import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { TaskTimerCard } from "@/components/focus/TaskTimerCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Block, BlockTitle } from "@/components/ui/block";
import { Target, CheckCircle2, Clock, ArrowRight } from "lucide-react";
import { formatTime } from "@/lib/utils";
import type { IdeaWithProject } from "@/types";

interface FocusClientProps {
  activeTasks: IdeaWithProject[];
  completedToday: IdeaWithProject[];
}

export function FocusClient({ activeTasks, completedToday }: FocusClientProps) {
  const totalTimeToday = completedToday.reduce(
    (acc, idea) => acc + idea.timeSpentSeconds,
    0
  );

  const runningTask = activeTasks.find((task) => task.isTimerRunning);

  return (
    <>
      <PageHeader
        title="Focus"
        right={
          runningTask && (
            <Badge variant="default" className="animate-pulse">
              <Clock className="w-3 h-3 mr-1" />
              Active
            </Badge>
          )
        }
      />

      {/* Stats summary */}
      <Block className="!mb-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Today&apos;s Focus</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                {activeTasks.length} tasks
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500 dark:text-slate-400">Time Logged</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatTime(totalTimeToday)}
              </p>
            </div>
          </div>
        </Card>
      </Block>

      {/* Active tasks */}
      {activeTasks.length === 0 ? (
        <Block>
          <Card className="p-8 text-center">
            <Target className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
              No tasks scheduled
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              Schedule some ideas for today to start tracking your progress
            </p>
            <Link href="/projects">
              <Button>
                Browse Projects
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </Card>
        </Block>
      ) : (
        <>
          <BlockTitle>Active Tasks</BlockTitle>
          <Block className="space-y-3">
            {activeTasks.map((task) => (
              <TaskTimerCard key={task.id} idea={task} />
            ))}
          </Block>
        </>
      )}

      {/* Completed today */}
      {completedToday.length > 0 && (
        <>
          <BlockTitle className="!mt-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Completed Today ({completedToday.length})
            </div>
          </BlockTitle>
          <Block className="space-y-2">
            {completedToday.map((task) => (
              <Card key={task.id} className="p-3 bg-green-50 dark:bg-green-900/20">
                <div className="flex items-center gap-3">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: task.project?.color ?? "#94a3b8" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-slate-50 truncate">
                      {task.title}
                    </p>
                  </div>
                  <Badge variant="success" className="shrink-0">
                    {formatTime(task.timeSpentSeconds)}
                  </Badge>
                </div>
              </Card>
            ))}
          </Block>
        </>
      )}
    </>
  );
}
