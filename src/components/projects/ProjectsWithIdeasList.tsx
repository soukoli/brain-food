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
import { Plus, FolderOpen, ChevronRight, Target, Clock, CheckCircle2 } from "lucide-react";
import { formatTime } from "@/lib/utils";
import { toast } from "sonner";
import type { ProjectWithIdeas } from "@/types";
import type { Idea } from "@/lib/db/schema";

interface ProjectsWithIdeasListProps {
  projects: ProjectWithIdeas[];
}

export function ProjectsWithIdeasList({ projects }: ProjectsWithIdeasListProps) {
  const router = useRouter();
  const [schedulingId, setSchedulingId] = useState<string | null>(null);

  const handleScheduleForFocus = async (idea: Idea, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (idea.scheduledForToday) {
      toast.info("Already in Focus");
      return;
    }

    setSchedulingId(idea.id);
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
    } finally {
      setSchedulingId(null);
    }
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
    <Block className="space-y-6">
      {projects.map((project) => (
        <div key={project.id} className="space-y-2">
          {/* Project Header */}
          <Link href={`/projects/${project.id}`}>
            <Card
              className="p-4 hover:shadow-md transition-all border-l-4 group"
              style={{ borderLeftColor: project.color }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: project.color + "20" }}
                  >
                    <FolderOpen className="w-5 h-5" style={{ color: project.color }} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-slate-50 truncate">
                      {project.name}
                    </h3>
                    {project.description && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                        {project.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant="secondary"
                    style={{ backgroundColor: project.color + "20", color: project.color }}
                  >
                    {project.ideas.length} {project.ideas.length === 1 ? "idea" : "ideas"}
                  </Badge>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
                </div>
              </div>
            </Card>
          </Link>

          {/* Ideas under this project */}
          {project.ideas.length > 0 && (
            <div className="ml-4 space-y-2">
              {project.ideas.map((idea) => {
                const isScheduled = !!idea.scheduledForToday;
                const isCompleted = idea.status === "completed";
                const isScheduling = schedulingId === idea.id;

                return (
                  <IdeaSheet
                    key={idea.id}
                    idea={idea}
                    trigger={
                      <Card
                        className="p-3 cursor-pointer hover:shadow-md transition-all border-l-2"
                        style={{ borderLeftColor: project.color }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            {/* Bold title */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-slate-900 dark:text-slate-50">
                                {idea.title}
                              </h4>
                              {isScheduled && !isCompleted && (
                                <Badge variant="default" className="bg-orange-500 text-xs">
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

                          {/* Quick Focus button */}
                          {!isScheduled && !isCompleted && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="shrink-0 h-8 w-8 text-orange-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950"
                              onClick={(e) => handleScheduleForFocus(idea, e)}
                              disabled={isScheduling}
                            >
                              <Target
                                className={`w-4 h-4 ${isScheduling ? "animate-pulse" : ""}`}
                              />
                            </Button>
                          )}
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
                    Add idea to {project.name}
                  </Button>
                }
              />
            </div>
          )}

          {/* Empty project - show add button */}
          {project.ideas.length === 0 && (
            <div className="ml-4">
              <IdeaSheet
                projectId={project.id}
                trigger={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full border border-dashed border-slate-200 dark:border-slate-700 hover:border-slate-400 text-slate-500"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add first idea to {project.name}
                  </Button>
                }
              />
            </div>
          )}
        </div>
      ))}
    </Block>
  );
}
