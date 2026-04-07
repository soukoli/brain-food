"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Folder } from "lucide-react";
import type { ProjectWithCount } from "@/types";

interface ProjectCardProps {
  project: ProjectWithCount;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/projects/${project.id}`}>
      <Card
        className="p-4 hover:shadow-lg transition-all duration-200 group border-2 h-full"
        style={{
          borderColor: project.color + "40",
          background: `linear-gradient(135deg, ${project.color}10 0%, ${project.color}05 100%)`,
        }}
      >
        {/* Color header bar */}
        <div
          className="w-full h-1.5 rounded-full mb-3"
          style={{ backgroundColor: project.color }}
        />

        {/* Icon with color */}
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
          style={{ backgroundColor: project.color + "20" }}
        >
          <Folder className="w-5 h-5" style={{ color: project.color }} />
        </div>

        {/* Project name */}
        <h3 className="font-bold text-slate-900 dark:text-slate-50 truncate text-base">
          {project.name}
        </h3>

        {/* Description */}
        {project.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">
            {project.description}
          </p>
        )}

        {/* Idea count */}
        <p className="text-sm font-semibold mt-2" style={{ color: project.color }}>
          {project.ideaCount} {project.ideaCount === 1 ? "idea" : "ideas"}
        </p>
      </Card>
    </Link>
  );
}
