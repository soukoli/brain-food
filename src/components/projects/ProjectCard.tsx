"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Folder } from "lucide-react";
import type { ProjectWithCount } from "@/types";

interface ProjectCardProps {
  project: ProjectWithCount;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="p-4 hover:shadow-md transition-all duration-200 group">
        <div className="flex items-center gap-3">
          {/* Color indicator */}
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: project.color + "20" }}
          >
            <Folder className="w-5 h-5" style={{ color: project.color }} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900 dark:text-slate-50 truncate">
                {project.name}
              </h3>
              <Badge variant="secondary" className="shrink-0">
                {project.ideaCount} {project.ideaCount === 1 ? "idea" : "ideas"}
              </Badge>
            </div>
            {project.description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {project.description}
              </p>
            )}
          </div>

          {/* Arrow */}
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors shrink-0" />
        </div>
      </Card>
    </Link>
  );
}
