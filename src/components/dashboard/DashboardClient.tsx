"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Block, BlockTitle } from "@/components/ui/block";
import { Zap, Calendar, FolderOpen, Inbox, ChevronRight, Target } from "lucide-react";
import { toast } from "sonner";
import type { IdeaWithProject, DashboardStats } from "@/types";

interface DashboardClientProps {
  stats: DashboardStats;
  recentIdeas: IdeaWithProject[];
}

export function DashboardClient({ stats, recentIdeas }: DashboardClientProps) {
  const router = useRouter();

  const handleScheduleForFocus = async (idea: IdeaWithProject, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (idea.scheduledForToday) {
      toast.info("Already in Focus");
      return;
    }

    try {
      const response = await fetch(`/api/ideas/${idea.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledForToday: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add to Focus");
      }

      toast.success("Added to Focus!");
      router.refresh();
    } catch {
      toast.error("Failed to add to Focus");
    }
  };

  return (
    <div className="pb-4">
      {/* Header */}
      <Block className="!mt-0 !mb-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Welcome back</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">What will you accomplish today?</p>
      </Block>

      {/* Quick Actions */}
      <Block className="!mb-4">
        <div className="grid grid-cols-2 gap-3">
          <Link href="/capture" className="block">
            <Button size="lg" className="w-full h-14 text-base gap-2 bg-blue-600 hover:bg-blue-700">
              <Zap className="h-5 w-5" />
              Quick Capture
            </Button>
          </Link>
          <Link href="/focus" className="block">
            <Button
              size="lg"
              variant="outline"
              className="w-full h-14 text-base gap-2 border-orange-200 hover:bg-orange-50 dark:border-orange-800 dark:hover:bg-orange-950"
            >
              <Target className="h-5 w-5 text-orange-500" />
              <span className="text-orange-600 dark:text-orange-400">Focus</span>
              {stats.inProgressCount > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs font-medium bg-orange-500 text-white rounded-full">
                  {stats.inProgressCount}
                </span>
              )}
            </Button>
          </Link>
        </div>
      </Block>

      {/* Stats Row */}
      <Block className="!mb-4">
        <div className="grid grid-cols-3 gap-3">
          <Link href="/focus" className="block">
            <Card className="p-4 hover:shadow-md transition-shadow border-orange-100 dark:border-orange-900">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4 text-orange-500" />
              </div>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {stats.todayCount}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Today</p>
            </Card>
          </Link>

          <Link href="/projects" className="block">
            <Card className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-1">
                <FolderOpen className="h-4 w-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.projectCount}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Projects</p>
            </Card>
          </Link>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Inbox className="h-4 w-4 text-slate-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              {stats.inboxCount}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Inbox</p>
          </Card>
        </div>
      </Block>

      {/* Recent Ideas */}
      <BlockTitle>Recent Ideas</BlockTitle>
      <Block className="!mt-2">
        {recentIdeas.length === 0 ? (
          <Card className="p-8 text-center">
            <Inbox className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-600 dark:text-slate-400">
              No ideas yet. Capture your first thought!
            </p>
            <Link href="/capture" className="mt-4 inline-block">
              <Button size="sm">
                <Zap className="h-4 w-4 mr-2" />
                Capture
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentIdeas.map((idea) => {
              const isScheduled = !!idea.scheduledForToday;
              const isCompleted = idea.status === "completed";

              return (
                <Card key={idea.id} className="p-4 hover:shadow-md transition-all duration-200">
                  <div className="flex items-start gap-3">
                    {/* Project color bar */}
                    <div
                      className="w-1 h-full min-h-[2.5rem] rounded-full shrink-0 self-stretch"
                      style={{
                        backgroundColor: idea.project?.color ?? "#94a3b8",
                      }}
                    />

                    <div className="flex-1 min-w-0">
                      {/* Title - BOLD */}
                      <p className="font-bold text-slate-900 dark:text-slate-50 break-words">
                        {idea.title}
                      </p>

                      {/* Description if exists */}
                      {idea.description && (
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 line-clamp-1">
                          {idea.description}
                        </p>
                      )}

                      {/* Project name with color */}
                      {idea.project && (
                        <Link
                          href={`/projects/${idea.project.id}`}
                          className="mt-1.5 text-xs font-medium hover:underline inline-block"
                          style={{ color: idea.project.color }}
                        >
                          {idea.project.name}
                        </Link>
                      )}
                    </div>

                    {/* Quick Focus button */}
                    {!isScheduled && !isCompleted && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="shrink-0 h-8 w-8 text-orange-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950"
                        onClick={(e) => handleScheduleForFocus(idea, e)}
                      >
                        <Target className="w-4 h-4" />
                      </Button>
                    )}
                    {isScheduled && !isCompleted && (
                      <div className="shrink-0 h-8 w-8 flex items-center justify-center text-orange-500">
                        <Target className="w-4 h-4 fill-orange-500" />
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Block>

      {/* View All Projects Link */}
      <Block>
        <Link href="/projects" className="block">
          <Card className="p-4 hover:shadow-md transition-all duration-200 group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <FolderOpen className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-50">View All Projects</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {stats.projectCount} project
                    {stats.projectCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
            </div>
          </Card>
        </Link>
      </Block>
    </div>
  );
}
