"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { KanbanColumn, type ColumnId } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";
import { toast } from "sonner";
import type { IdeaWithProject } from "@/types";
import type { Project } from "@/lib/db/schema";

interface KanbanBoardProps {
  readyTasks: IdeaWithProject[];
  inProgressTasks: IdeaWithProject[];
  doneTasks: IdeaWithProject[];
  projects?: Project[];
}

// Map column IDs to DB status values
const COLUMN_TO_STATUS: Record<ColumnId, string> = {
  ready: "inbox",
  "in-progress": "in-progress",
  done: "completed",
};

export function KanbanBoard({
  readyTasks: initialReady,
  inProgressTasks: initialInProgress,
  doneTasks: initialDone,
  projects = [],
}: KanbanBoardProps) {
  const router = useRouter();

  // Local state for optimistic updates
  const [columns, setColumns] = useState({
    ready: initialReady,
    "in-progress": initialInProgress,
    done: initialDone,
  });

  const [activeTask, setActiveTask] = useState<IdeaWithProject | null>(null);
  const [isTimerLoading, setIsTimerLoading] = useState(false);

  // Configure drag sensor (requires 8px movement to start drag)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Find which column a task is in
  const findColumn = useCallback(
    (taskId: string): ColumnId | null => {
      for (const [columnId, tasks] of Object.entries(columns)) {
        if (tasks.some((t) => t.id === taskId)) {
          return columnId as ColumnId;
        }
      }
      return null;
    },
    [columns]
  );

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = Object.values(columns)
      .flat()
      .find((t) => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  // Handle drag over (for visual feedback)
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeColumn = findColumn(activeId);
    // Check if dropping over a column or another task
    const overColumn = (
      ["ready", "in-progress", "done"].includes(overId) ? overId : findColumn(overId)
    ) as ColumnId | null;

    if (!activeColumn || !overColumn || activeColumn === overColumn) return;

    // Move task to new column optimistically
    setColumns((prev) => {
      const activeTask = prev[activeColumn].find((t) => t.id === activeId);
      if (!activeTask) return prev;

      return {
        ...prev,
        [activeColumn]: prev[activeColumn].filter((t) => t.id !== activeId),
        [overColumn]: [...prev[overColumn], activeTask],
      };
    });
  };

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Determine target column
    const targetColumn = (
      ["ready", "in-progress", "done"].includes(overId) ? overId : findColumn(overId)
    ) as ColumnId | null;

    if (!targetColumn) return;

    // Update server
    const newStatus = COLUMN_TO_STATUS[targetColumn];
    try {
      const response = await fetch(`/api/ideas/${activeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          // If moving to done, set completedAt
          ...(targetColumn === "done" && { completedAt: new Date().toISOString() }),
          // If moving out of done, clear completedAt
          ...(targetColumn !== "done" && { completedAt: null }),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update task");
      }

      router.refresh();
    } catch {
      toast.error("Failed to move task");
      // Revert on error - refresh to get server state
      router.refresh();
    }
  };

  // Handle timer toggle
  const handleTimerToggle = async (task: IdeaWithProject) => {
    setIsTimerLoading(true);
    try {
      const response = await fetch(`/api/ideas/${task.id}/timer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: task.isTimerRunning ? "stop" : "start",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to toggle timer");
      }

      router.refresh();
    } catch {
      toast.error("Failed to toggle timer");
    } finally {
      setIsTimerLoading(false);
    }
  };

  const handleTaskUpdate = () => {
    router.refresh();
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 h-full overflow-x-auto pb-4">
        <KanbanColumn
          id="ready"
          title="Ready"
          tasks={columns.ready}
          color="bg-primary"
          projects={projects}
          onTimerToggle={handleTimerToggle}
          isTimerLoading={isTimerLoading}
          onTaskUpdate={handleTaskUpdate}
        />
        <KanbanColumn
          id="in-progress"
          title="In Progress"
          tasks={columns["in-progress"]}
          color="bg-warning"
          projects={projects}
          onTimerToggle={handleTimerToggle}
          isTimerLoading={isTimerLoading}
          onTaskUpdate={handleTaskUpdate}
        />
        <KanbanColumn
          id="done"
          title="Done Today"
          tasks={columns.done}
          color="bg-success"
          projects={projects}
          onTimerToggle={handleTimerToggle}
          isTimerLoading={isTimerLoading}
          onTaskUpdate={handleTaskUpdate}
        />
      </div>

      {/* Drag overlay - shows the card being dragged */}
      <DragOverlay>
        {activeTask && (
          <div className="rotate-3 scale-105">
            <KanbanCard task={activeTask} projects={projects} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
