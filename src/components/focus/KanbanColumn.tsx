"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { KanbanCard } from "./KanbanCard";
import { cn } from "@/lib/utils";
import type { IdeaWithProject } from "@/types";
import type { Project } from "@/lib/db/schema";

export type ColumnId = "ready" | "in-progress" | "done";

interface KanbanColumnProps {
  id: ColumnId;
  title: string;
  tasks: IdeaWithProject[];
  color: string;
  projects?: Project[];
  onTimerToggle?: (task: IdeaWithProject) => void;
  isTimerLoading?: boolean;
  onTaskUpdate?: () => void;
}

export function KanbanColumn({
  id,
  title,
  tasks,
  color,
  projects = [],
  onTimerToggle,
  isTimerLoading,
  onTaskUpdate,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex flex-col h-full min-w-[280px] max-w-[320px]">
      {/* Column header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className={cn("w-2.5 h-2.5 rounded-full", color)} />
        <h3 className="font-semibold text-text-primary text-sm">{title}</h3>
        <span className="text-xs text-text-muted bg-muted rounded-full px-2 py-0.5">
          {tasks.length}
        </span>
      </div>

      {/* Column content */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 rounded-xl p-2 transition-colors min-h-[200px]",
          "bg-muted/50",
          isOver && "bg-primary-light/50 ring-2 ring-primary ring-inset"
        )}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {tasks.map((task) => (
              <KanbanCard
                key={task.id}
                task={task}
                projects={projects}
                onTimerToggle={onTimerToggle}
                isTimerLoading={isTimerLoading}
                onTaskUpdate={onTaskUpdate}
              />
            ))}

            {tasks.length === 0 && (
              <div className="text-center py-8 text-text-muted text-sm">Drop tasks here</div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}
