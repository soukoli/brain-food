"use client";

import { ProjectCard } from "./ProjectCard";
import { ProjectSheet } from "./ProjectSheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, FolderOpen } from "lucide-react";
import type { ProjectWithCount } from "@/types";

interface ProjectListProps {
  projects: ProjectWithCount[];
}

export function ProjectList({ projects }: ProjectListProps) {
  if (projects.length === 0) {
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
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
