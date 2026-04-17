"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, Target, Quote, RefreshCw, X, Lightbulb, Sparkles, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import type { IdeaWithProject, DashboardStats } from "@/types";

interface DashboardClientProps {
  userName: string;
  stats: DashboardStats;
  recentIdeas: IdeaWithProject[];
}

interface QuoteData {
  quote: string;
  author: string;
}

export function DashboardClient({ userName, stats, recentIdeas }: DashboardClientProps) {
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
    <div className="px-4 pt-6 pb-4 space-y-5">
      {/* Header with greeting */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-normal text-text-primary">
          Hello <span className="font-bold">{userName},</span>
        </h1>
        <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl border border-border">
          <Sparkles className="w-5 h-5 text-primary" />
        </Button>
      </div>

      {/* Quote Card - styled like "Total Balance" card */}
      <AnimatePresence>
        {isQuoteVisible && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="p-5 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-none shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                  Daily Inspiration
                </span>
                <div className="flex items-center gap-1">
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
              {isLoadingQuote ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-5 bg-border rounded w-3/4"></div>
                  <div className="h-5 bg-border rounded w-1/2"></div>
                </div>
              ) : quote ? (
                <>
                  <p className="text-lg font-medium text-text-primary leading-relaxed">
                    &ldquo;{quote.quote}&rdquo;
                  </p>
                  <p className="mt-2 text-sm text-text-secondary">— {quote.author}</p>
                </>
              ) : (
                <p className="text-lg text-text-secondary">Start your day with purpose</p>
              )}
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

      {/* Stats Card - Projects, Ideas, Focus */}
      <Card className="p-5">
        <div className="grid grid-cols-3 divide-x divide-border">
          <Link href="/projects" className="pr-3 text-center">
            <p className="text-xs text-text-secondary mb-1">Projects</p>
            <p className="text-2xl font-bold text-text-primary">{stats.projectCount}</p>
          </Link>
          <Link href="/projects" className="px-3 text-center">
            <p className="text-xs text-text-secondary mb-1">Ideas</p>
            <p className="text-2xl font-bold text-text-primary">{stats.totalIdeas}</p>
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

      {/* Recent Ideas Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">Recent Ideas</h2>
          <Link
            href="/projects"
            className="text-sm text-text-primary font-medium flex items-center gap-1"
          >
            See All
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {recentIdeas.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary-light flex items-center justify-center">
              <Lightbulb className="h-6 w-6 text-primary" />
            </div>
            <p className="text-text-secondary mb-4">No ideas yet. Capture your first thought!</p>
            <Link href="/capture">
              <Button size="sm">
                <Zap className="h-4 w-4 mr-2" />
                Capture Idea
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentIdeas.slice(0, 4).map((idea) => {
              const isScheduled = !!idea.scheduledForToday;
              const isCompleted = idea.status === "completed";
              const projectColor = idea.project?.color ?? "#94a3b8";

              return (
                <Card key={idea.id} className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Icon with circular progress indicator */}
                    <div className="relative">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: projectColor + "15" }}
                      >
                        <Lightbulb className="w-5 h-5" style={{ color: projectColor }} />
                      </div>
                      {/* Progress ring - shows if scheduled */}
                      {isScheduled && (
                        <svg className="absolute inset-0 w-12 h-12 -rotate-90">
                          <circle
                            cx="24"
                            cy="24"
                            r="22"
                            fill="none"
                            stroke={isCompleted ? "#22c55e" : projectColor}
                            strokeWidth="3"
                            strokeDasharray={isCompleted ? "138" : "69"}
                            strokeDashoffset="0"
                            strokeLinecap="round"
                          />
                        </svg>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-text-primary truncate">{idea.title}</p>
                      {idea.project && (
                        <p className="text-sm text-text-secondary mt-0.5">{idea.project.name}</p>
                      )}
                    </div>

                    {/* Quick Focus button */}
                    {!isScheduled && !isCompleted && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="shrink-0 h-9 w-9 text-warning hover:text-warning hover:bg-warning-light"
                        onClick={(e) => handleScheduleForFocus(idea, e)}
                      >
                        <Target className="w-5 h-5" />
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
