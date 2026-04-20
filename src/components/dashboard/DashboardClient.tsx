"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ProjectStatsChart } from "@/components/dashboard/ProjectStatsChart";
import { TaskListItem } from "@/components/tasks/TaskListItem";
import {
  Bell,
  Quote,
  RefreshCw,
  X,
  CheckSquare,
  ChevronRight,
  FolderOpen,
  CheckCircle2,
  Clock,
  ListTodo,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { IdeaWithProject, DashboardStats, RecentProject, ProjectStats } from "@/types";

interface DashboardClientProps {
  userName: string;
  userImage?: string | null;
  stats: DashboardStats;
  weeklyStats?: {
    completedThisWeek: number;
    timeThisWeek: number;
  };
  recentProjects: RecentProject[];
  projectStats?: ProjectStats[];
  recentTasks: IdeaWithProject[];
}

interface QuoteData {
  quote: string;
  author: string;
}

// Format time as "Xh Ym" or "Xm" or "0m"
function formatTimeShort(seconds: number): string {
  if (seconds < 60) return "0m";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function DashboardClient({
  userName,
  userImage,
  stats,
  weeklyStats,
  recentProjects,
  projectStats = [],
  recentTasks,
}: DashboardClientProps) {
  const router = useRouter();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(true);
  const [isQuoteVisible, setIsQuoteVisible] = useState(true);
  const hasLoadedQuote = useRef(false);

  // Check if quote was dismissed today
  useEffect(() => {
    const dismissedDate = localStorage.getItem("quoteDismissedDate");
    const today = new Date().toDateString();
    if (dismissedDate !== today) {
      setIsQuoteVisible(true);
    } else {
      setIsQuoteVisible(false);
    }
  }, []);

  // Fetch quote only once on mount
  useEffect(() => {
    if (isQuoteVisible && !hasLoadedQuote.current) {
      hasLoadedQuote.current = true;
      fetchQuote();
    }
  }, [isQuoteVisible]);

  const fetchQuote = async () => {
    setIsLoadingQuote(true);
    try {
      const response = await fetch("/api/quote");
      if (response.ok) {
        const { data } = await response.json();
        setQuote(data);
      }
    } catch (error) {
      console.error("Failed to fetch quote:", error);
    } finally {
      setIsLoadingQuote(false);
    }
  };

  const handleDismissQuote = () => {
    setIsQuoteVisible(false);
    localStorage.setItem("quoteDismissedDate", new Date().toDateString());
  };

  const handleShowQuote = () => {
    setIsQuoteVisible(true);
    localStorage.removeItem("quoteDismissedDate");
    fetchQuote();
  };

  // Desktop layout
  if (isDesktop) {
    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-primary-light flex items-center justify-center">
              {userImage ? (
                <Image
                  src={userImage}
                  alt={userName}
                  width={56}
                  height={56}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xl font-bold text-primary">
                  {userName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Hello, {userName}</h1>
              <p className="text-text-secondary">Welcome back</p>
            </div>
          </div>

          <Link href="/focus">
            <Button
              variant="ghost"
              size="icon"
              className="w-11 h-11 rounded-xl border border-border relative"
            >
              <Bell className="w-5 h-5 text-text-primary" />
              {stats.todayCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-warning text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {stats.todayCount}
                </span>
              )}
            </Button>
          </Link>
        </div>

        {/* Quote - compact for desktop */}
        <AnimatePresence>
          {isQuoteVisible && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-none">
                <div className="flex items-start gap-3">
                  <Quote className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    {isLoadingQuote ? (
                      <div className="space-y-2 animate-pulse">
                        <div className="h-4 bg-border rounded w-3/4"></div>
                        <div className="h-3 bg-border rounded w-1/3"></div>
                      </div>
                    ) : quote ? (
                      <>
                        <p className="text-sm font-medium text-text-primary leading-relaxed line-clamp-2">
                          &ldquo;{quote.quote}&rdquo;
                        </p>
                        <p className="mt-1 text-xs text-text-secondary">— {quote.author}</p>
                      </>
                    ) : (
                      <p className="text-sm text-text-secondary">Start your day with purpose</p>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-text-muted hover:text-primary"
                      onClick={fetchQuote}
                      disabled={isLoadingQuote}
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${isLoadingQuote ? "animate-spin" : ""}`}
                      />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-text-muted hover:text-text-primary"
                      onClick={handleDismissQuote}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats cards row */}
        <div className="grid grid-cols-4 gap-4">
          <StatsCard
            title="Projects"
            value={stats.projectCount}
            icon={FolderOpen}
            iconColor="text-primary"
            iconBgColor="bg-primary-light"
          />
          <StatsCard
            title="Total Tasks"
            value={stats.totalTasks}
            subtitle={`${stats.inProgressCount} in progress`}
            icon={ListTodo}
            iconColor="text-warning"
            iconBgColor="bg-warning-light"
          />
          <StatsCard
            title="Completed"
            value={weeklyStats?.completedThisWeek ?? 0}
            subtitle="this week"
            icon={CheckCircle2}
            iconColor="text-success"
            iconBgColor="bg-success-light"
          />
          <StatsCard
            title="Time Logged"
            value={formatTimeShort(weeklyStats?.timeThisWeek ?? 0)}
            subtitle="this week"
            icon={Clock}
            iconColor="text-info"
            iconBgColor="bg-info-light"
          />
        </div>

        {/* Two column layout: Projects chart + Recent Tasks */}
        <div className="grid grid-cols-2 gap-6">
          {/* Projects chart */}
          <div className="space-y-4">
            <ProjectStatsChart projects={projectStats} />

            {/* Recent Projects */}
            {recentProjects.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-semibold text-text-primary">Recent Projects</h2>
                  <Link
                    href="/projects"
                    className="text-sm text-text-secondary font-medium flex items-center gap-0.5"
                  >
                    All <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {recentProjects.slice(0, 3).map((project) => {
                    const firstLetter = project.name.charAt(0).toUpperCase();
                    return (
                      <Link key={project.id} href={`/projects/${project.id}`}>
                        <Card className="p-3 hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                              style={{ backgroundColor: project.color + "20" }}
                            >
                              <span className="text-sm font-bold" style={{ color: project.color }}>
                                {firstLetter}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-text-primary truncate">
                                {project.name}
                              </p>
                              <p className="text-xs text-text-muted">
                                {formatTimeShort(project.totalTimeSpent)}
                              </p>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Recent Tasks */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-text-primary">Recent Tasks</h2>
              <Link
                href="/projects"
                className="text-sm text-text-secondary font-medium flex items-center gap-0.5"
              >
                All Tasks <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {recentTasks.length === 0 ? (
              <Card className="p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary-light flex items-center justify-center">
                  <CheckSquare className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm text-text-secondary">No tasks yet</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {recentTasks.slice(0, 6).map((task) => (
                  <TaskListItem
                    key={task.id}
                    task={task}
                    showProject={true}
                    showTime={true}
                    showActions={true}
                    onStartFocus={() => router.push("/focus")}
                    compact={true}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Mobile layout (original)
  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      {/* Header with avatar and notification bell */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-primary-light flex items-center justify-center">
            {userImage ? (
              <Image
                src={userImage}
                alt={userName}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-lg font-bold text-primary">
                {userName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-xl font-semibold text-text-primary">Hello, {userName}</h1>
            <p className="text-sm text-text-secondary">Welcome back</p>
          </div>
        </div>

        <Link href="/focus">
          <Button
            variant="ghost"
            size="icon"
            className="w-11 h-11 rounded-xl border border-border relative"
          >
            <Bell className="w-5 h-5 text-text-primary" />
            {stats.todayCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-warning text-white text-xs font-bold rounded-full flex items-center justify-center">
                {stats.todayCount}
              </span>
            )}
          </Button>
        </Link>
      </div>

      {/* Quote Card */}
      <AnimatePresence>
        {isQuoteVisible && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-none shadow-sm">
              <div className="flex items-start gap-3">
                <Quote className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  {isLoadingQuote ? (
                    <div className="space-y-2 animate-pulse">
                      <div className="h-4 bg-border rounded w-3/4"></div>
                      <div className="h-3 bg-border rounded w-1/3"></div>
                    </div>
                  ) : quote ? (
                    <>
                      <p className="text-sm font-medium text-text-primary leading-relaxed line-clamp-2">
                        &ldquo;{quote.quote}&rdquo;
                      </p>
                      <p className="mt-1 text-xs text-text-secondary">— {quote.author}</p>
                    </>
                  ) : (
                    <p className="text-sm text-text-secondary">Start your day with purpose</p>
                  )}
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-text-muted hover:text-primary"
                    onClick={fetchQuote}
                    disabled={isLoadingQuote}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingQuote ? "animate-spin" : ""}`} />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-text-muted hover:text-text-primary"
                    onClick={handleDismissQuote}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {!isQuoteVisible && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-text-muted hover:text-primary h-8"
          onClick={handleShowQuote}
        >
          <Quote className="w-4 h-4 mr-2" />
          Show daily quote
        </Button>
      )}

      {/* Stats Card */}
      <Card className="p-4">
        <div className="grid grid-cols-3 divide-x divide-border">
          <Link href="/projects" className="pr-3 text-center">
            <p className="text-xs text-text-secondary mb-1">Projects</p>
            <p className="text-2xl font-bold text-text-primary">{stats.projectCount}</p>
          </Link>
          <Link href="/projects" className="px-3 text-center">
            <p className="text-xs text-text-secondary mb-1">Tasks</p>
            <p className="text-2xl font-bold text-text-primary">{stats.totalTasks}</p>
          </Link>
          <Link href="/focus" className="pl-3 text-center">
            <p className="text-xs text-text-secondary mb-1">Focus</p>
            <p className="text-2xl font-bold text-text-primary">{stats.todayCount}</p>
            {stats.inProgressCount > 0 && (
              <p className="text-xs text-success mt-0.5">{stats.inProgressCount} active</p>
            )}
          </Link>
        </div>
      </Card>

      {/* Weekly Stats for mobile */}
      {weeklyStats && (weeklyStats.completedThisWeek > 0 || weeklyStats.timeThisWeek > 0) && (
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-success-light flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-success" />
            </div>
            <div>
              <p className="text-xs text-text-muted">Done this week</p>
              <p className="text-lg font-bold text-text-primary">{weeklyStats.completedThisWeek}</p>
            </div>
          </Card>
          <Card className="p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-light flex items-center justify-center">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-text-muted">Time logged</p>
              <p className="text-lg font-bold text-text-primary">
                {formatTimeShort(weeklyStats.timeThisWeek)}
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Recent Projects Carousel */}
      {recentProjects.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-text-primary">Recent Projects</h2>
            <Link
              href="/projects"
              className="text-sm text-text-secondary font-medium flex items-center gap-0.5"
            >
              All
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {recentProjects.map((project) => {
              const firstLetter = project.name.charAt(0).toUpperCase();
              const timeAgo = formatDistanceToNow(new Date(project.lastActivityAt), {
                addSuffix: false,
              });

              return (
                <Link key={project.id} href={`/projects/${project.id}`} className="shrink-0">
                  <Card className="w-36 p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: project.color + "20" }}
                      >
                        <span className="text-base font-bold" style={{ color: project.color }}>
                          {firstLetter}
                        </span>
                      </div>
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                    </div>
                    <p className="text-xs text-text-secondary mb-0.5">
                      {formatTimeShort(project.totalTimeSpent)}
                    </p>
                    <p className="text-sm font-medium text-text-primary truncate">{project.name}</p>
                    <p className="text-xs text-text-muted mt-1">{timeAgo} ago</p>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Tasks Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-text-primary">Recent Tasks</h2>
          <Link
            href="/projects"
            className="text-sm text-text-secondary font-medium flex items-center gap-0.5"
          >
            All Tasks
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {recentTasks.length === 0 ? (
          <Card className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary-light flex items-center justify-center">
              <CheckSquare className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm text-text-secondary mb-1">No tasks yet</p>
            <p className="text-xs text-text-muted">Create your first task to get started</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentTasks.slice(0, 5).map((task) => (
              <TaskListItem
                key={task.id}
                task={task}
                showProject={true}
                showTime={true}
                showActions={true}
                onStartFocus={() => router.push("/focus")}
                compact={false}
              />
            ))}
          </div>
        )}
      </div>

      {/* Empty state when no projects */}
      {recentProjects.length === 0 && recentTasks.length === 0 && (
        <Card className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-light flex items-center justify-center">
            <FolderOpen className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">Get Started</h3>
          <p className="text-text-secondary mb-4">
            Create your first project and add tasks to stay organized
          </p>
          <Link href="/projects">
            <Button>
              <FolderOpen className="h-4 w-4 mr-2" />
              Go to Projects
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
