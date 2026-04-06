"use client";

import { ProjectCard } from "./ProjectCard";
import { ProjectSheet } from "./ProjectSheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Block } from "@/components/ui/block";
import { Plus, FolderOpen } from "lucide-react";
import type { ProjectWithCount } from "@/types";

interface ProjectListProps {
  projects: ProjectWithCount[];
}

export function ProjectList({ projects }: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <Block>
        <Card className="p-8 text-center">
          <FolderOpen className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
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
    <Block className="space-y-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </Block>
  );
}
