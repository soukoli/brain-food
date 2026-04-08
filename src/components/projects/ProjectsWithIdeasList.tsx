"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProjectSheet } from "./ProjectSheet";
import { IdeaSheet } from "@/components/ideas/IdeaSheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Block } from "@/components/ui/block";
import { SwipeableCard } from "@/components/ui/swipeable-card";
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
  Inbox,
} from "lucide-react";
import { formatTime } from "@/lib/utils";
import { PRIORITIES } from "@/lib/constants";
import { toast } from "sonner";
import type { ProjectWithIdeas } from "@/types";
import type { Idea, Project } from "@/lib/db/schema";

interface ProjectsWithIdeasListProps {
  projects: ProjectWithIdeas[];
  orphanIdeas?: Idea[];
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
    const priorityA = a.priority ? (PRIORITY_ORDER[a.priority] ?? 99) : 99;
    const priorityB = b.priority ? (PRIORITY_ORDER[b.priority] ?? 99) : 99;
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function ProjectsWithIdeasList({ projects, orphanIdeas = [] }: ProjectsWithIdeasListProps) {
  const router = useRouter();
  const [schedulingId, setSchedulingId] = useState<string | null>(null);
  const [removingFromFocusId, setRemovingFromFocusId] = useState<string | null>(null);
  // Track collapsed state per project (default: ALL collapsed)
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(
    () => new Set(projects.map(p => p.id))
  );
  // Track collapsed state for Quick Ideas section (collapsed by default)
  const [quickIdeasCollapsed, setQuickIdeasCollapsed] = useState(true);

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

  const handleDeleteIdea = async (ideaId: string) => {
    const response = await fetch(`/api/ideas/${ideaId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete idea");
    }

    toast.success("Idea deleted");
    router.refresh();
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

  // Render an idea card - compact iOS style
  const renderIdeaCard = (idea: Idea, borderColor: string, allProjects?: Project[]) => {
    const isScheduled = !!idea.scheduledForToday;
    const isCompleted = idea.status === "completed";
    const isScheduling = schedulingId === idea.id;
    const isRemoving = removingFromFocusId === idea.id;
    const priorityInfo = getPriorityInfo(idea.priority);

    const cardContent = (
      <Card
        className={`p-2.5 cursor-pointer active:bg-slate-50 dark:active:bg-slate-900 transition-all border-l-2 ${
          isCompleted ? "opacity-60" : ""
        }`}
        style={{ borderLeftColor: borderColor }}
      >
        <div className="flex items-center gap-2">
          {/* Priority indicator */}
          {priorityInfo && (
            <div className="shrink-0" title={priorityInfo.label}>
              {idea.priority === "urgent" ? (
                <AlertCircle className="w-3.5 h-3.5" style={{ color: priorityInfo.color }} />
              ) : idea.priority === "high" ? (
                <ArrowUp className="w-3.5 h-3.5" style={{ color: priorityInfo.color }} />
              ) : (
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: priorityInfo.color }} />
              )}
            </div>
          )}

          {/* Title and meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={`font-medium text-sm text-slate-900 dark:text-slate-50 truncate ${isCompleted ? "line-through" : ""}`}>
                {idea.title}
              </span>
              {isScheduled && !isCompleted && (
                <Target className="w-3 h-3 text-orange-500 shrink-0" />
              )}
              {isCompleted && (
                <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
              )}
            </div>
            {idea.timeSpentSeconds > 0 && (
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Clock className="w-2.5 h-2.5" />
                {formatTime(idea.timeSpentSeconds)}
              </div>
            )}
          </div>

          {/* Quick action */}
          <div className="shrink-0">
            {isScheduled && !isCompleted ? (
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-slate-400 hover:text-red-500"
                onClick={(e) => handleRemoveFromFocus(idea, e)}
                disabled={isRemoving}
              >
                <X className={`w-3.5 h-3.5 ${isRemoving ? "animate-pulse" : ""}`} />
              </Button>
            ) : !isScheduled ? (
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-orange-500 hover:text-orange-600"
                onClick={(e) => handleScheduleForFocus(idea, e)}
                disabled={isScheduling}
              >
                <Target className={`w-3.5 h-3.5 ${isScheduling ? "animate-pulse" : ""}`} />
              </Button>
            ) : null}
          </div>
        </div>
      </Card>
    );

    return (
      <SwipeableCard
        key={idea.id}
        onDelete={() => handleDeleteIdea(idea.id)}
        ideaTitle={idea.title}
      >
        <IdeaSheet idea={idea} projects={allProjects} trigger={cardContent} />
      </SwipeableCard>
    );
  };

  const sortedOrphanIdeas = sortIdeasByPriority(orphanIdeas);

  if (projects.length === 0 && orphanIdeas.length === 0) {
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
    <Block className="space-y-2">
      {/* Regular projects */}
      {projects.map((project) => {
        const isCollapsed = collapsedProjects.has(project.id);
        const sortedIdeas = sortIdeasByPriority(project.ideas);
        const hasUrgent = sortedIdeas.some((i) => i.priority === "urgent");
        const focusCount = sortedIdeas.filter(
          (i) => i.scheduledForToday && i.status !== "completed"
        ).length;

        return (
          <div key={project.id}>
            {/* Project Header - Compact iOS-style */}
            <Card
              className="p-3 active:bg-slate-50 dark:active:bg-slate-900 transition-all border-l-4 cursor-pointer"
              style={{ borderLeftColor: project.color }}
              onClick={(e) => toggleProjectCollapse(project.id, e)}
            >
              <div className="flex items-center gap-2.5">
                {/* Icon with chevron overlay */}
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 relative"
                  style={{ backgroundColor: project.color + "20" }}
                >
                  <FolderOpen className="w-4 h-4" style={{ color: project.color }} />
                  <div className="absolute -right-0.5 -bottom-0.5 w-4 h-4 bg-white dark:bg-slate-950 rounded-full flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-800">
                    {isCollapsed ? (
                      <ChevronRight className="w-2.5 h-2.5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Project info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-50 truncate">
                      {project.name}
                    </h3>
                    {hasUrgent && <Flame className="w-3 h-3 text-red-500 shrink-0" />}
                  </div>
                  {project.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {project.description}
                    </p>
                  )}
                </div>

                {/* Badges */}
                <div className="flex items-center gap-1 shrink-0">
                  {focusCount > 0 && (
                    <Badge className="bg-orange-500 text-[10px] h-5 px-1.5 font-medium">
                      {focusCount}
                    </Badge>
                  )}
                  <Badge
                    variant="secondary"
                    className="h-5 px-1.5 text-[10px] font-medium"
                    style={{ backgroundColor: project.color + "15", color: project.color }}
                  >
                    {project.ideas.length}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Ideas - collapsible */}
            {!isCollapsed && (
              <div className="ml-3 mt-1.5 space-y-1.5 border-l-2 border-slate-100 dark:border-slate-800 pl-2">
                {sortedIdeas.map((idea) => renderIdeaCard(idea, project.color))}
                
                {/* Add idea button */}
                <IdeaSheet
                  projectId={project.id}
                  trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-8 border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 text-xs"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      {sortedIdeas.length === 0 ? "Add first idea" : "Add idea"}
                    </Button>
                  }
                />
              </div>
            )}
          </div>
        );
      })}

      {/* Quick Ideas - at the bottom */}
      {sortedOrphanIdeas.length > 0 && (
        <div>
          <Card
            className="p-3 active:bg-slate-100 dark:active:bg-slate-800 transition-all border-l-4 border-l-slate-400 bg-slate-50 dark:bg-slate-900/50 cursor-pointer"
            onClick={() => setQuickIdeasCollapsed(!quickIdeasCollapsed)}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-slate-200 dark:bg-slate-700 relative">
                <Inbox className="w-4 h-4 text-slate-500" />
                <div className="absolute -right-0.5 -bottom-0.5 w-4 h-4 bg-white dark:bg-slate-950 rounded-full flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-800">
                  {quickIdeasCollapsed ? (
                    <ChevronRight className="w-2.5 h-2.5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                  Quick Ideas
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tap to assign to project
                </p>
              </div>
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-slate-200 dark:bg-slate-700">
                {sortedOrphanIdeas.length}
              </Badge>
            </div>
          </Card>

          {!quickIdeasCollapsed && (
            <div className="ml-3 mt-1.5 space-y-1.5 border-l-2 border-slate-200 dark:border-slate-700 pl-2">
              {sortedOrphanIdeas.map((idea) => renderIdeaCard(idea, "#94a3b8", projects))}
            </div>
          )}
        </div>
      )}
    </Block>
  );
}
