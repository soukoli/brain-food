"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProjectSheet } from "./ProjectSheet";
import { IdeaList } from "@/components/ideas/IdeaList";
import { IdeaSheet } from "@/components/ideas/IdeaSheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Block } from "@/components/ui/block";
import { Plus, Edit2, Trash2, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import type { Project, Idea } from "@/lib/db/schema";

interface ProjectDetailClientProps {
  project: Project;
  ideas: Idea[];
}

export function ProjectDetailClient({ project, ideas }: ProjectDetailClientProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete project");
      }

      toast.success("Project deleted");
      router.push("/projects");
      router.refresh();
    } catch {
      toast.error("Failed to delete project");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <PageHeader
        title={project.name}
        showBack
        backHref="/projects"
        right={
          <div className="flex items-center gap-1">
            <ProjectSheet
              project={project}
              trigger={
                <Button size="icon" variant="ghost">
                  <Edit2 className="h-5 w-5" />
                </Button>
              }
            />
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button size="icon" variant="ghost" className="text-red-600">
                  <Trash2 className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Project</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete &quot;{project.name}&quot;? This action cannot
                    be undone. Ideas in this project will not be deleted but will become unassigned.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                    {isDeleting ? "Deleting..." : "Delete"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {/* Project header card */}
      <Block className="!mb-4">
        <Card
          className="p-4 border-2"
          style={{
            borderColor: project.color + "40",
            background: `linear-gradient(135deg, ${project.color}10 0%, ${project.color}05 100%)`,
          }}
        >
          <div className="flex items-start gap-3">
            {/* Color bar */}
            <div
              className="w-2 h-full min-h-[3rem] rounded-full shrink-0 self-stretch"
              style={{ backgroundColor: project.color }}
            />
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                {project.name}
              </h2>
              {project.description && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {project.description}
                </p>
              )}
              <p className="text-sm font-semibold mt-2" style={{ color: project.color }}>
                {ideas.length} {ideas.length === 1 ? "idea" : "ideas"}
              </p>
            </div>
          </div>
        </Card>
      </Block>

      {/* Ideas list */}
      {ideas.length === 0 ? (
        <Block>
          <Card className="p-8 text-center">
            <Lightbulb className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-2">
              No ideas yet
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              Add your first idea to this project
            </p>
            <IdeaSheet
              projectId={project.id}
              trigger={
                <Button style={{ backgroundColor: project.color }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Idea
                </Button>
              }
            />
          </Card>
        </Block>
      ) : (
        <>
          <Block className="!mb-2 flex justify-end">
            <IdeaSheet
              projectId={project.id}
              trigger={
                <Button size="sm" style={{ backgroundColor: project.color }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Idea
                </Button>
              }
            />
          </Block>
          <IdeaList ideas={ideas.map((idea) => ({ ...idea, project }))} />
        </>
      )}
    </>
  );
}
