"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Zap,
  Calendar,
  FolderOpen,
  Lightbulb,
  ChevronRight,
  Target,
  Quote,
  RefreshCw,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import type { IdeaWithProject, DashboardStats } from "@/types";

interface DashboardClientProps {
  stats: DashboardStats;
  recentIdeas: IdeaWithProject[];
}

interface QuoteData {
  quote: string;
  author: string;
}

export function DashboardClient({ stats, recentIdeas }: DashboardClientProps) {
  const router = useRouter();
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(true);
  const [isQuoteVisible, setIsQuoteVisible] = useState(true);

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

  // Fetch quote on mount
  useEffect(() => {
    if (isQuoteVisible) {
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
    <div className="px-4 pb-4 space-y-4">
      {/* Inspirational Quote - Dismissible */}
      <AnimatePresence>
        {isQuoteVisible && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="p-4 bg-gradient-to-br from-primary-light to-info-light border-none">
              <div className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Quote className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  {isLoadingQuote ? (
                    <div className="space-y-2 animate-pulse">
                      <div className="h-4 bg-border rounded w-3/4"></div>
                      <div className="h-4 bg-border rounded w-1/2"></div>
                    </div>
                  ) : quote ? (
                    <>
                      <p className="text-sm font-medium text-text-primary italic leading-relaxed">
                        &ldquo;{quote.quote}&rdquo;
                      </p>
                      <p className="mt-2 text-xs font-semibold text-primary">— {quote.author}</p>
                    </>
                  ) : (
                    <p className="text-sm text-text-secondary">Start your day with purpose</p>
                  )}
                </div>
                <div className="shrink-0 flex flex-col gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-text-muted hover:text-text-primary"
                    onClick={handleDismissQuote}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-text-muted hover:text-primary"
                    onClick={fetchQuote}
                    disabled={isLoadingQuote}
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingQuote ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Show quote button when hidden */}
      {!isQuoteVisible && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-text-muted hover:text-primary"
          onClick={handleShowQuote}
        >
          <Quote className="w-4 h-4 mr-2" />
          Show daily quote
        </Button>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/capture" className="block">
          <Button size="lg" className="w-full h-14 text-base gap-2">
            <Zap className="h-5 w-5" />
            Quick Capture
          </Button>
        </Link>
        <Link href="/focus" className="block">
          <Button size="lg" variant="warning" className="w-full h-14 text-base gap-2">
            <Target className="h-5 w-5" />
            Focus
            {stats.inProgressCount > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs font-medium bg-white/20 rounded-full">
                {stats.inProgressCount}
              </span>
            )}
          </Button>
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <Link href="/focus" className="block">
          <Card className="p-4 text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-warning-light flex items-center justify-center">
              <Calendar className="h-5 w-5 text-warning" />
            </div>
            <p className="text-2xl font-bold text-text-primary">{stats.todayCount}</p>
            <p className="text-xs text-text-secondary mt-1">Today</p>
          </Card>
        </Link>

        <Link href="/projects" className="block">
          <Card className="p-4 text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-primary-light flex items-center justify-center">
              <FolderOpen className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold text-text-primary">{stats.projectCount}</p>
            <p className="text-xs text-text-secondary mt-1">Projects</p>
          </Card>
        </Link>

        <Card className="p-4 text-center">
          <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-warning-light flex items-center justify-center">
            <Lightbulb className="h-5 w-5 text-warning" />
          </div>
          <p className="text-2xl font-bold text-text-primary">{stats.totalIdeas}</p>
          <p className="text-xs text-text-secondary mt-1">Ideas</p>
        </Card>
      </div>

      {/* Recent Ideas Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-text-primary">Recent Ideas</h2>
          <Link
            href="/projects"
            className="text-sm text-primary font-medium flex items-center gap-1"
          >
            View all
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {recentIdeas.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-warning-light flex items-center justify-center">
              <Lightbulb className="h-6 w-6 text-warning" />
            </div>
            <p className="text-text-secondary mb-4">No ideas yet. Capture your first thought!</p>
            <Link href="/capture">
              <Button size="sm">
                <Zap className="h-4 w-4 mr-2" />
                Capture
              </Button>
            </Link>
          </Card>
        ) : (
          <Card className="divide-y divide-border">
            {recentIdeas.map((idea) => {
              const isScheduled = !!idea.scheduledForToday;
              const isCompleted = idea.status === "completed";

              return (
                <div
                  key={idea.id}
                  className="flex items-center gap-3 p-4 hover:bg-background-secondary transition-colors duration-200"
                >
                  {/* Project color indicator as circle */}
                  <div
                    className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center"
                    style={{
                      backgroundColor: (idea.project?.color ?? "#94a3b8") + "20",
                    }}
                  >
                    <Lightbulb
                      className="w-5 h-5"
                      style={{ color: idea.project?.color ?? "#94a3b8" }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text-primary truncate">{idea.title}</p>
                    {idea.project && (
                      <p
                        className="text-xs font-medium mt-0.5"
                        style={{ color: idea.project.color }}
                      >
                        {idea.project.name}
                      </p>
                    )}
                  </div>

                  {/* Quick Focus button or indicator */}
                  {!isScheduled && !isCompleted ? (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="shrink-0 h-9 w-9 text-warning hover:text-warning hover:bg-warning-light"
                      onClick={(e) => handleScheduleForFocus(idea, e)}
                    >
                      <Target className="w-5 h-5" />
                    </Button>
                  ) : isScheduled && !isCompleted ? (
                    <div className="shrink-0 h-9 w-9 flex items-center justify-center">
                      <Target className="w-5 h-5 text-warning fill-warning" />
                    </div>
                  ) : (
                    <ChevronRight className="w-5 h-5 text-text-muted shrink-0" />
                  )}
                </div>
              );
            })}
          </Card>
        )}
      </div>

      {/* View All Projects Link */}
      <Card className="p-4 hover:shadow-card-hover transition-all duration-200">
        <Link href="/projects" className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center">
            <FolderOpen className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-text-primary">View All Projects</p>
            <p className="text-sm text-text-secondary">
              {stats.projectCount} project{stats.projectCount !== 1 ? "s" : ""}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-text-muted" />
        </Link>
      </Card>
    </div>
  );
}
