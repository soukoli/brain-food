"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProjectSheet } from "./ProjectSheet";
import { IdeaSheet } from "@/components/ideas/IdeaSheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Block } from "@/components/ui/block";
import {
  Plus,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Target,
  Clock,
  CheckCircle2,
  X,
  AlertCircle,
  ArrowUp,
  Flame,
} from "lucide-react";
import { formatTime } from "@/lib/utils";
import { PRIORITIES } from "@/lib/constants";
import { toast } from "sonner";
import type { ProjectWithIdeas } from "@/types";
import type { Idea } from "@/lib/db/schema";

interface ProjectsWithIdeasListProps {
  projects: ProjectWithIdeas[];
}

// Priority order for sorting (lower = higher priority)
const PRIORITY_ORDER: Record<string, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

// Sort ideas by priority (urgent first), then by creation date
function sortIdeasByPriority(ideas: Idea[]): Idea[] {
  return [...ideas].sort((a, b) => {
    // First by priority
    const priorityA = a.priority ? (PRIORITY_ORDER[a.priority] ?? 99) : 99;
    const priorityB = b.priority ? (PRIORITY_ORDER[b.priority] ?? 99) : 99;
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    // Then by creation date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function ProjectsWithIdeasList({ projects }: ProjectsWithIdeasListProps) {
  const router = useRouter();
  const [schedulingId, setSchedulingId] = useState<string | null>(null);
  const [removingFromFocusId, setRemovingFromFocusId] = useState<string | null>(null);
  // Track collapsed state per project (default: expanded)
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set());

  const toggleProjectCollapse = (projectId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCollapsedProjects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const handleScheduleForFocus = async (idea: Idea, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setSchedulingId(idea.id);
    try {
      const response = await fetch(`/api/ideas/${idea.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledForToday: new Date().toISOString(),
          // If completed, also reset status to in-progress
          ...(idea.status === "completed" && { status: "in-progress" }),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add to Focus");
      }

      toast.success(
        idea.status === "completed" ? "Reopened and added to Focus!" : "Added to Focus!"
      );
      router.refresh();
    } catch {
      toast.error("Failed to add to Focus");
    } finally {
      setSchedulingId(null);
    }
  };

  const handleRemoveFromFocus = async (idea: Idea, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setRemovingFromFocusId(idea.id);
    try {
      const response = await fetch(`/api/ideas/${idea.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledForToday: null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to remove from Focus");
      }

      toast.success("Removed from Focus");
      router.refresh();
    } catch {
      toast.error("Failed to remove from Focus");
    } finally {
      setRemovingFromFocusId(null);
    }
  };

  const getPriorityInfo = (priority: string | null) => {
    if (!priority) return null;
    return PRIORITIES.find((p) => p.value === priority);
  };

  if (projects.length === 0) {
    return (
      <Block>
        <Card className="p-8 text-center">
          <FolderOpen className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-2">
            No projects yet
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            Create your first project to start organizing your ideas
          </p>
          <ProjectSheet
            trigger={
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            }
          />
        </Card>
      </Block>
    );
  }

  return (
    <Block className="space-y-4">
      {projects.map((project) => {
        const isCollapsed = collapsedProjects.has(project.id);
        const sortedIdeas = sortIdeasByPriority(project.ideas);
        const hasUrgent = sortedIdeas.some((i) => i.priority === "urgent");
        const focusCount = sortedIdeas.filter(
          (i) => i.scheduledForToday && i.status !== "completed"
        ).length;

        return (
          <div key={project.id}>
            {/* Project Header - Clickable to collapse/expand */}
            <Card
              className="p-4 hover:shadow-md transition-all border-l-4 cursor-pointer"
              style={{ borderLeftColor: project.color }}
              onClick={(e) => toggleProjectCollapse(project.id, e)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Collapse/Expand indicator */}
                  <div className="shrink-0 text-slate-400">
                    {isCollapsed ? (
                      <ChevronRight className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: project.color + "20" }}
                  >
                    <FolderOpen className="w-5 h-5" style={{ color: project.color }} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg text-slate-900 dark:text-slate-50 truncate">
                        {project.name}
                      </h3>
                      {hasUrgent && <Flame className="w-4 h-4 text-red-500 shrink-0" />}
                    </div>
                    {project.description && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                        {project.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {focusCount > 0 && (
                    <Badge className="bg-orange-500 text-xs">
                      <Target className="w-3 h-3 mr-1" />
                      {focusCount}
                    </Badge>
                  )}
                  <Badge
                    variant="secondary"
                    style={{ backgroundColor: project.color + "20", color: project.color }}
                  >
                    {project.ideas.length}
                  </Badge>
                  <Link
                    href={`/projects/${project.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                  >
                    <ChevronRight className="w-5 h-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                  </Link>
                </div>
              </div>
            </Card>

            {/* Ideas under this project - collapsible */}
            {!isCollapsed && (
              <div className="ml-4 mt-2 space-y-2">
                {sortedIdeas.length > 0 ? (
                  <>
                    {sortedIdeas.map((idea) => {
                      const isScheduled = !!idea.scheduledForToday;
                      const isCompleted = idea.status === "completed";
                      const isScheduling = schedulingId === idea.id;
                      const isRemoving = removingFromFocusId === idea.id;
                      const priorityInfo = getPriorityInfo(idea.priority);

                      return (
                        <IdeaSheet
                          key={idea.id}
                          idea={idea}
                          trigger={
                            <Card
                              className={`p-3 cursor-pointer hover:shadow-md transition-all border-l-2 ${
                                isCompleted ? "opacity-60" : ""
                              }`}
                              style={{ borderLeftColor: project.color }}
                            >
                              <div className="flex items-start gap-3">
                                {/* Priority indicator */}
                                {priorityInfo && (
                                  <div className="shrink-0 mt-1" title={priorityInfo.label}>
                                    {idea.priority === "urgent" ? (
                                      <AlertCircle
                                        className="w-4 h-4"
                                        style={{ color: priorityInfo.color }}
                                      />
                                    ) : idea.priority === "high" ? (
                                      <ArrowUp
                                        className="w-4 h-4"
                                        style={{ color: priorityInfo.color }}
                                      />
                                    ) : (
                                      <div
                                        className="w-2 h-2 rounded-full mt-1"
                                        style={{ backgroundColor: priorityInfo.color }}
                                      />
                                    )}
                                  </div>
                                )}

                                <div className="flex-1 min-w-0">
                                  {/* Bold title with badges */}
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4
                                      className={`font-bold text-slate-900 dark:text-slate-50 ${
                                        isCompleted ? "line-through" : ""
                                      }`}
                                    >
                                      {idea.title}
                                    </h4>
                                    {priorityInfo && (
                                      <Badge
                                        variant={
                                          idea.priority === "urgent"
                                            ? "destructive"
                                            : idea.priority === "high"
                                              ? "warning"
                                              : "secondary"
                                        }
                                        className="text-xs"
                                      >
                                        {priorityInfo.label}
                                      </Badge>
                                    )}
                                    {isScheduled && !isCompleted && (
                                      <Badge className="bg-orange-500 text-xs">
                                        <Target className="w-3 h-3 mr-1" />
                                        Focus
                                      </Badge>
                                    )}
                                    {isCompleted && (
                                      <Badge variant="success" className="text-xs">
                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                        Done
                                      </Badge>
                                    )}
                                  </div>

                                  {/* Description - show first 2 lines */}
                                  {idea.description && (
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                                      {idea.description}
                                    </p>
                                  )}

                                  {/* Meta info */}
                                  {idea.timeSpentSeconds > 0 && (
                                    <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                                      <Clock className="w-3 h-3" />
                                      {formatTime(idea.timeSpentSeconds)}
                                    </div>
                                  )}
                                </div>

                                {/* Action buttons */}
                                <div className="flex items-center gap-1 shrink-0">
                                  {/* Remove from Focus button (if scheduled) */}
                                  {isScheduled && !isCompleted && (
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                                      onClick={(e) => handleRemoveFromFocus(idea, e)}
                                      disabled={isRemoving}
                                      title="Remove from Focus"
                                    >
                                      <X
                                        className={`w-4 h-4 ${isRemoving ? "animate-pulse" : ""}`}
                                      />
                                    </Button>
                                  )}

                                  {/* Add to Focus button (always show, even for completed) */}
                                  {!isScheduled && (
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8 text-orange-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950"
                                      onClick={(e) => handleScheduleForFocus(idea, e)}
                                      disabled={isScheduling}
                                      title={isCompleted ? "Reopen & Focus" : "Add to Focus"}
                                    >
                                      <Target
                                        className={`w-4 h-4 ${isScheduling ? "animate-pulse" : ""}`}
                                      />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </Card>
                          }
                        />
                      );
                    })}

                    {/* Add idea button */}
                    <IdeaSheet
                      projectId={project.id}
                      trigger={
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full border border-dashed border-slate-200 dark:border-slate-700 hover:border-slate-400 text-slate-500"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add idea
                        </Button>
                      }
                    />
                  </>
                ) : (
                  <IdeaSheet
                    projectId={project.id}
                    trigger={
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full border border-dashed border-slate-200 dark:border-slate-700 hover:border-slate-400 text-slate-500"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add first idea
                      </Button>
                    }
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </Block>
  );
}
