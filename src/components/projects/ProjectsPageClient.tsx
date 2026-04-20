"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProjectSheet } from "./ProjectSheet";
import { IdeaSheet } from "@/components/ideas/IdeaSheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SwipeableCard } from "@/components/ui/swipeable-card";
import {
  Plus,
  FolderOpen,
  Target,
  Clock,
  CheckCircle2,
  X,
  AlertCircle,
  ArrowUp,
  Pencil,
  Trash2,
  Inbox,
} from "lucide-react";
import { formatTime } from "@/lib/utils";
import { PRIORITIES } from "@/lib/constants";
import { toast } from "sonner";
import type { ProjectWithIdeas } from "@/types";
import type { Idea, Project } from "@/lib/db/schema";

interface ProjectsPageClientProps {
  projects: ProjectWithIdeas[];
  orphanIdeas: Idea[];
}

// Priority order for sorting
const PRIORITY_ORDER: Record<string, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

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

function calculateProgress(ideas: Idea[]): number {
  if (ideas.length === 0) return 0;
  const completed = ideas.filter((i) => i.status === "completed").length;
  return Math.round((completed / ideas.length) * 100);
}

export function ProjectsPageClient({ projects, orphanIdeas }: ProjectsPageClientProps) {
  const router = useRouter();
  const tabsRef = useRef<HTMLDivElement>(null);

  // Selected tab: -1 = Quick Tasks, 0+ = project index
  const [selectedIndex, setSelectedIndex] = useState(orphanIdeas.length > 0 ? -1 : 0);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Sort projects alphabetically
  const sortedProjects = [...projects].sort((a, b) => a.name.localeCompare(b.name, "cs"));

  // Auto-scroll to selected tab
  useEffect(() => {
    if (tabsRef.current) {
      const activeTab = tabsRef.current.querySelector('[data-active="true"]');
      if (activeTab) {
        activeTab.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  }, [selectedIndex]);

  const handleDeleteIdea = async (ideaId: string) => {
    const response = await fetch(`/api/ideas/${ideaId}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Failed to delete");
    toast.success("Task deleted");
    router.refresh();
  };

  const handleScheduleForFocus = async (idea: Idea, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const response = await fetch(`/api/ideas/${idea.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledForToday: new Date().toISOString(),
          ...(idea.status === "completed" && { status: "in-progress" }),
        }),
      });
      if (!response.ok) throw new Error("Failed");
      toast.success(
        idea.status === "completed" ? "Reopened and added to Focus!" : "Added to Focus!"
      );
      router.refresh();
    } catch {
      toast.error("Failed to add to Focus");
    }
  };

  const handleRemoveFromFocus = async (idea: Idea, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const response = await fetch(`/api/ideas/${idea.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledForToday: null }),
      });
      if (!response.ok) throw new Error("Failed");
      toast.success("Removed from Focus");
      router.refresh();
    } catch {
      toast.error("Failed to remove from Focus");
    }
  };

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (!confirm(`Delete "${projectName}" and all its tasks?`)) return;

    try {
      const response = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed");
      toast.success("Project deleted");
      setSelectedIndex(0);
      router.refresh();
    } catch {
      toast.error("Failed to delete project");
    }
  };

  const getPriorityInfo = (priority: string | null) => {
    if (!priority) return null;
    return PRIORITIES.find((p) => p.value === priority);
  };

  // Get current project data
  const currentProject = selectedIndex >= 0 ? sortedProjects[selectedIndex] : null;
  const currentTasks = currentProject
    ? sortIdeasByPriority(currentProject.ideas)
    : sortIdeasByPriority(orphanIdeas);
  const progress = currentProject ? calculateProgress(currentProject.ideas) : 0;

  // Render task card
  const renderTaskCard = (task: Idea, color: string) => {
    const isScheduled = !!task.scheduledForToday;
    const isCompleted = task.status === "completed";
    const priorityInfo = getPriorityInfo(task.priority);

    const cardContent = (
      <div
        className={`p-3 bg-surface rounded-lg border border-border ${isCompleted ? "opacity-60" : ""}`}
      >
        <div className="flex items-start gap-3">
          {/* Color indicator */}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
            style={{ backgroundColor: color + "20" }}
          >
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`font-medium text-text-primary text-sm ${isCompleted ? "line-through" : ""}`}
              >
                {task.title}
              </span>
              {priorityInfo && (task.priority === "urgent" || task.priority === "high") && (
                <span title={priorityInfo.label}>
                  {task.priority === "urgent" ? (
                    <AlertCircle className="w-3.5 h-3.5" style={{ color: priorityInfo.color }} />
                  ) : (
                    <ArrowUp className="w-3.5 h-3.5" style={{ color: priorityInfo.color }} />
                  )}
                </span>
              )}
            </div>

            {task.description && (
              <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">{task.description}</p>
            )}

            {/* Meta */}
            <div className="flex items-center gap-2 mt-1.5 text-xs text-text-muted">
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
              {task.timeSpentSeconds > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(task.timeSpentSeconds)}
                </span>
              )}
            </div>
          </div>

          {/* Action button */}
          <div className="shrink-0">
            {isScheduled && !isCompleted ? (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-text-muted hover:text-error hover:bg-error-light"
                onClick={(e) => handleRemoveFromFocus(task, e)}
              >
                <X className="w-4 h-4" />
              </Button>
            ) : !isCompleted ? (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-warning hover:text-warning hover:bg-warning-light"
                onClick={(e) => handleScheduleForFocus(task, e)}
              >
                <Target className="w-4 h-4" />
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    );

    return (
      <SwipeableCard
        key={task.id}
        onDelete={() => handleDeleteIdea(task.id)}
        ideaTitle={task.title}
      >
        <IdeaSheet idea={task} projects={sortedProjects} trigger={cardContent} />
      </SwipeableCard>
    );
  };

  // Empty state - no projects at all
  if (sortedProjects.length === 0 && orphanIdeas.length === 0) {
    return (
      <div className="px-4 pt-4">
        <Card className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-light flex items-center justify-center">
            <FolderOpen className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            Create your first project
          </h3>
          <p className="text-text-secondary mb-6">
            Organize your tasks into projects to stay focused and productive
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
    <div className="flex flex-col h-full">
      {/* Tab Bar - sticky */}
      <div ref={tabsRef} className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex gap-1 px-4 py-2 overflow-x-auto scrollbar-hide">
          {/* Quick Tasks tab */}
          {orphanIdeas.length > 0 && (
            <button
              data-active={selectedIndex === -1}
              onClick={() => setSelectedIndex(-1)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedIndex === -1
                  ? "bg-text-secondary text-white"
                  : "bg-background-secondary text-text-secondary hover:bg-border"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Inbox className="w-4 h-4" />
                Inbox
                <span className="text-xs opacity-70">({orphanIdeas.length})</span>
              </span>
            </button>
          )}

          {/* Project tabs */}
          {sortedProjects.map((project, index) => (
            <button
              key={project.id}
              data-active={selectedIndex === index}
              onClick={() => setSelectedIndex(index)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedIndex === index
                  ? "text-white"
                  : "bg-background-secondary text-text-secondary hover:bg-border"
              }`}
              style={selectedIndex === index ? { backgroundColor: project.color } : {}}
            >
              {project.name}
            </button>
          ))}
        </div>
      </div>

      {/* Project Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Project Header */}
        {currentProject ? (
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">{currentProject.name}</h2>
              <p className="text-sm text-text-secondary">
                {currentProject.ideas.length} {currentProject.ideas.length === 1 ? "task" : "tasks"}
                {progress > 0 && ` • ${progress}% done`}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-text-muted hover:text-text-primary"
                onClick={() => setEditingProject(currentProject)}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-text-muted hover:text-error"
                onClick={() => handleDeleteProject(currentProject.id, currentProject.name)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Inbox</h2>
            <p className="text-sm text-text-secondary">
              {orphanIdeas.length} {orphanIdeas.length === 1 ? "task" : "tasks"} without project
            </p>
          </div>
        )}

        {/* Task List */}
        <div className="space-y-2">
          {currentTasks.map((task) => renderTaskCard(task, currentProject?.color ?? "#94a3b8"))}
        </div>

        {/* Add Task Button */}
        <div className="mt-4">
          <IdeaSheet
            projectId={currentProject?.id}
            projects={sortedProjects}
            trigger={
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-10 border border-dashed border-border text-text-muted"
              >
                <Plus className="w-4 h-4 mr-2" />
                {currentTasks.length === 0 ? "Add first task" : "Add task"}
              </Button>
            }
          />
        </div>

        {/* Empty state for current project */}
        {currentTasks.length === 0 && currentProject && (
          <div className="text-center py-8">
            <p className="text-text-muted text-sm">No tasks in this project yet</p>
          </div>
        )}
      </div>

      {/* Edit Project Sheet */}
      {editingProject && (
        <ProjectSheet
          project={editingProject}
          open={!!editingProject}
          onOpenChange={(open) => !open && setEditingProject(null)}
        />
      )}
    </div>
  );
}
