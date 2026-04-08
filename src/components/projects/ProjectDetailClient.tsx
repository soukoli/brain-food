"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProjectSheet } from "./ProjectSheet";
import { IdeaSheet } from "@/components/ideas/IdeaSheet";
import { SwipeableCard } from "@/components/ui/swipeable-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Block } from "@/components/ui/block";
import {
  Plus,
  Edit2,
  Trash2,
  Lightbulb,
  Target,
  Clock,
  CheckCircle2,
  X,
  AlertCircle,
  ArrowUp,
} from "lucide-react";
import { formatTime } from "@/lib/utils";
import { PRIORITIES } from "@/lib/constants";
import { toast } from "sonner";
import type { Project, Idea } from "@/lib/db/schema";

interface ProjectDetailClientProps {
  project: Project;
  ideas: Idea[];
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
    if (priorityA !== priorityB) return priorityA - priorityB;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function ProjectDetailClient({ project, ideas }: ProjectDetailClientProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [schedulingId, setSchedulingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const sortedIdeas = sortIdeasByPriority(ideas);
  const completedCount = ideas.filter((i) => i.status === "completed").length;
  const focusCount = ideas.filter((i) => i.scheduledForToday && i.status !== "completed").length;

  const handleDeleteProject = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete project");
      toast.success("Project deleted");
      router.push("/projects");
      router.refresh();
    } catch {
      toast.error("Failed to delete project");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteIdea = async (ideaId: string) => {
    const response = await fetch(`/api/ideas/${ideaId}`, { method: "DELETE" });
    if (!response.ok) throw new Error("Failed to delete idea");
    toast.success("Idea deleted");
    router.refresh();
  };

  const handleSchedule = async (idea: Idea, e: React.MouseEvent) => {
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
      if (!response.ok) throw new Error("Failed");
      toast.success(idea.status === "completed" ? "Reopened & added to Focus!" : "Added to Focus!");
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
    setRemovingId(idea.id);
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
    } finally {
      setRemovingId(null);
    }
  };

  const getPriorityInfo = (priority: string | null) => {
    if (!priority) return null;
    return PRIORITIES.find((p) => p.value === priority);
  };

  const renderIdeaCard = (idea: Idea) => {
    const isScheduled = !!idea.scheduledForToday;
    const isCompleted = idea.status === "completed";
    const isScheduling = schedulingId === idea.id;
    const isRemoving = removingId === idea.id;
    const priorityInfo = getPriorityInfo(idea.priority);

    const cardContent = (
      <Card
        className={`p-2.5 cursor-pointer active:bg-slate-50 dark:active:bg-slate-900 transition-all border-l-2 ${
          isCompleted ? "opacity-60" : ""
        }`}
        style={{ borderLeftColor: project.color }}
      >
        <div className="flex items-center gap-2">
          {priorityInfo && (
            <div className="shrink-0" title={priorityInfo.label}>
              {idea.priority === "urgent" ? (
                <AlertCircle className="w-3.5 h-3.5" style={{ color: priorityInfo.color }} />
              ) : idea.priority === "high" ? (
                <ArrowUp className="w-3.5 h-3.5" style={{ color: priorityInfo.color }} />
              ) : (
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: priorityInfo.color }}
                />
              )}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span
                className={`font-medium text-sm text-slate-900 dark:text-slate-50 truncate ${isCompleted ? "line-through" : ""}`}
              >
                {idea.title}
              </span>
              {isScheduled && !isCompleted && (
                <Target className="w-3 h-3 text-orange-500 shrink-0" />
              )}
              {isCompleted && <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />}
            </div>
            {idea.timeSpentSeconds > 0 && (
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Clock className="w-2.5 h-2.5" />
                {formatTime(idea.timeSpentSeconds)}
              </div>
            )}
          </div>

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
                onClick={(e) => handleSchedule(idea, e)}
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
        <IdeaSheet idea={idea} trigger={cardContent} />
      </SwipeableCard>
    );
  };

  return (
    <>
      <PageHeader
        title={project.name}
        showBack
        backHref="/projects"
        right={
          <div className="flex items-center gap-1">
            <IdeaSheet
              projectId={project.id}
              trigger={
                <Button size="icon" variant="ghost">
                  <Plus className="h-5 w-5" />
                </Button>
              }
            />
            <ProjectSheet
              project={project}
              trigger={
                <Button size="icon" variant="ghost">
                  <Edit2 className="h-5 w-5" />
                </Button>
              }
            />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="icon" variant="ghost" className="text-red-600">
                  <Trash2 className="h-5 w-5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Project</AlertDialogTitle>
                  <AlertDialogDescription>
                    Delete &quot;{project.name}&quot;? Ideas will become unassigned.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteProject}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        }
      />

      {/* Compact stats bar */}
      <Block className="!mb-3">
        <div className="flex items-center gap-2 px-1">
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: project.color }}
          />
          {project.description && (
            <span className="text-xs text-slate-500 truncate flex-1">{project.description}</span>
          )}
          <div className="flex items-center gap-2 shrink-0">
            {focusCount > 0 && (
              <Badge className="bg-orange-500 text-[10px] h-5 px-1.5">
                <Target className="w-2.5 h-2.5 mr-0.5" />
                {focusCount}
              </Badge>
            )}
            {completedCount > 0 && (
              <Badge variant="secondary" className="text-[10px] h-5 px-1.5 text-green-600">
                <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
                {completedCount}
              </Badge>
            )}
            <Badge
              variant="secondary"
              className="text-[10px] h-5 px-1.5"
              style={{ color: project.color }}
            >
              {ideas.length} idea{ideas.length !== 1 ? "s" : ""}
            </Badge>
          </div>
        </div>
      </Block>

      {/* Ideas list */}
      {ideas.length === 0 ? (
        <Block>
          <Card className="p-6 text-center">
            <Lightbulb className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400 mb-3 text-sm">No ideas yet</p>
            <IdeaSheet
              projectId={project.id}
              trigger={
                <Button size="sm" style={{ backgroundColor: project.color }}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Idea
                </Button>
              }
            />
          </Card>
        </Block>
      ) : (
        <Block className="space-y-1.5">
          {sortedIdeas.map((idea) => renderIdeaCard(idea))}

          {/* Add idea button at bottom */}
          <IdeaSheet
            projectId={project.id}
            trigger={
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-8 border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add idea
              </Button>
            }
          />
        </Block>
      )}
    </>
  );
}
