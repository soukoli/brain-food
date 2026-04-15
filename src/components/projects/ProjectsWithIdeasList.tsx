"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProjectSheet } from "./ProjectSheet";
import { IdeaSheet } from "@/components/ideas/IdeaSheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Lightbulb,
  Folder,
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
    () => new Set(projects.map((p) => p.id))
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

  // Render an idea card - new design style
  const renderIdeaCard = (idea: Idea, borderColor: string, allProjects?: Project[]) => {
    const isScheduled = !!idea.scheduledForToday;
    const isCompleted = idea.status === "completed";
    const isScheduling = schedulingId === idea.id;
    const isRemoving = removingFromFocusId === idea.id;
    const priorityInfo = getPriorityInfo(idea.priority);

    const cardContent = (
      <div
        className={`flex items-center gap-3 p-3 bg-surface rounded-lg border border-border shadow-card hover:shadow-card-hover transition-all ${
          isCompleted ? "opacity-60" : ""
        }`}
      >
        {/* Icon with color */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: borderColor + "20" }}
        >
          <Lightbulb className="w-5 h-5" style={{ color: borderColor }} />
        </div>

        {/* Title and meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`font-semibold text-text-primary truncate ${isCompleted ? "line-through" : ""}`}
            >
              {idea.title}
            </span>
            {priorityInfo && (
              <span title={priorityInfo.label}>
                {idea.priority === "urgent" ? (
                  <AlertCircle className="w-4 h-4" style={{ color: priorityInfo.color }} />
                ) : idea.priority === "high" ? (
                  <ArrowUp className="w-4 h-4" style={{ color: priorityInfo.color }} />
                ) : null}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-text-secondary">
            {isScheduled && !isCompleted && (
              <span className="flex items-center gap-1 text-warning">
                <Target className="w-3 h-3" />
                Focus
              </span>
            )}
            {isCompleted && (
              <span className="flex items-center gap-1 text-success">
                <CheckCircle2 className="w-3 h-3" />
                Done
              </span>
            )}
            {idea.timeSpentSeconds > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(idea.timeSpentSeconds)}
              </span>
            )}
          </div>
        </div>

        {/* Quick action */}
        <div className="shrink-0">
          {isScheduled && !isCompleted ? (
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9 text-text-muted hover:text-error hover:bg-error-light"
              onClick={(e) => handleRemoveFromFocus(idea, e)}
              disabled={isRemoving}
            >
              <X className={`w-4 h-4 ${isRemoving ? "animate-pulse" : ""}`} />
            </Button>
          ) : !isScheduled ? (
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9 text-warning hover:text-warning hover:bg-warning-light"
              onClick={(e) => handleScheduleForFocus(idea, e)}
              disabled={isScheduling}
            >
              <Target className={`w-4 h-4 ${isScheduling ? "animate-pulse" : ""}`} />
            </Button>
          ) : (
            <ChevronRight className="w-5 h-5 text-text-muted" />
          )}
        </div>
      </div>
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
      <div className="px-4">
        <Card className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-light flex items-center justify-center">
            <FolderOpen className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">No projects yet</h3>
          <p className="text-text-secondary mb-6">
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
      </div>
    );
  }

  return (
    <div className="px-4 space-y-3">
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
            {/* Project Header - New design */}
            <div
              className="flex items-center gap-4 p-4 bg-surface rounded-lg border border-border shadow-card hover:shadow-card-hover transition-all cursor-pointer"
              onClick={(e) => toggleProjectCollapse(project.id, e)}
            >
              {/* Icon with project color */}
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: project.color + "20" }}
              >
                <Folder className="w-6 h-6" style={{ color: project.color }} />
              </div>

              {/* Project info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-text-primary truncate">{project.name}</h3>
                  {hasUrgent && <Flame className="w-4 h-4 text-error shrink-0" />}
                </div>
                {project.description && (
                  <p className="text-sm text-text-secondary truncate mt-0.5">
                    {project.description}
                  </p>
                )}
              </div>

              {/* Badges and chevron */}
              <div className="flex items-center gap-2 shrink-0">
                {focusCount > 0 && (
                  <Badge className="bg-warning text-text-inverse text-xs px-2">{focusCount}</Badge>
                )}
                <Badge
                  variant="secondary"
                  className="text-xs px-2"
                  style={{ backgroundColor: project.color + "15", color: project.color }}
                >
                  {project.ideas.length}
                </Badge>
                {isCollapsed ? (
                  <ChevronRight className="w-5 h-5 text-text-muted" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-text-muted" />
                )}
              </div>
            </div>

            {/* Ideas - collapsible */}
            {!isCollapsed && (
              <div className="mt-2 ml-6 space-y-2 border-l-2 border-border pl-4">
                {sortedIdeas.map((idea) => renderIdeaCard(idea, project.color))}

                {/* Add idea button */}
                <IdeaSheet
                  projectId={project.id}
                  trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-10 border border-dashed border-border text-text-muted"
                    >
                      <Plus className="w-4 h-4 mr-2" />
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
          <div
            className="flex items-center gap-4 p-4 bg-background-secondary rounded-lg border border-border shadow-card cursor-pointer"
            onClick={() => setQuickIdeasCollapsed(!quickIdeasCollapsed)}
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-border">
              <Inbox className="w-6 h-6 text-text-secondary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-text-secondary">Quick Ideas</h3>
              <p className="text-sm text-text-muted">Tap to assign to project</p>
            </div>
            <Badge variant="secondary" className="text-xs px-2">
              {sortedOrphanIdeas.length}
            </Badge>
            {quickIdeasCollapsed ? (
              <ChevronRight className="w-5 h-5 text-text-muted" />
            ) : (
              <ChevronDown className="w-5 h-5 text-text-muted" />
            )}
          </div>

          {!quickIdeasCollapsed && (
            <div className="mt-2 ml-6 space-y-2 border-l-2 border-border pl-4">
              {sortedOrphanIdeas.map((idea) => renderIdeaCard(idea, "#94a3b8", projects))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
