"use client";

import Link from "next/link";
import { Folder, ChevronRight } from "lucide-react";
import type { ProjectWithCount } from "@/types";

interface ProjectCardProps {
  project: ProjectWithCount;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/projects/${project.id}`} className="block">
      <div className="flex items-center gap-4 p-4 bg-surface rounded-lg border border-border shadow-card hover:shadow-card-hover transition-all duration-200">
        {/* Icon with project color */}
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: project.color + "20" }}
        >
          <Folder className="w-6 h-6" style={{ color: project.color }} />
        </div>

        {/* Project info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-text-primary truncate">{project.name}</h3>
          {project.description ? (
            <p className="text-sm text-text-secondary truncate mt-0.5">{project.description}</p>
          ) : (
            <p className="text-sm font-medium mt-0.5" style={{ color: project.color }}>
              {project.ideaCount} {project.ideaCount === 1 ? "task" : "tasks"}
            </p>
          )}
        </div>

        {/* Chevron for navigation */}
        <ChevronRight className="w-5 h-5 text-text-muted shrink-0" />
      </div>
    </Link>
  );
}
