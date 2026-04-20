"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card } from "@/components/ui/card";
import { Clock, CheckCircle2, ListTodo } from "lucide-react";
import type { ProjectStats } from "@/types";

interface ProjectStatsChartProps {
  projects: ProjectStats[];
}

// Format time as "Xh Ym" for display
function formatTimeShort(seconds: number): string {
  if (seconds < 60) return "0m";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${minutes}m`;
}

// Custom tooltip component
function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    payload: ProjectStats & { completionRate: number };
  }>;
}) {
  if (!active || !payload || !payload[0]) return null;

  const project = payload[0].payload;

  return (
    <Card className="p-3 shadow-lg border-none bg-surface">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
        <span className="font-semibold text-text-primary text-sm">{project.name}</span>
      </div>
      <div className="space-y-1 text-xs">
        <div className="flex items-center justify-between gap-4">
          <span className="text-text-muted flex items-center gap-1">
            <ListTodo className="w-3 h-3" /> Tasks
          </span>
          <span className="text-text-primary font-medium">{project.taskCount}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-text-muted flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Done
          </span>
          <span className="text-success font-medium">
            {project.completedCount} ({Math.round(project.completionRate)}%)
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-text-muted flex items-center gap-1">
            <Clock className="w-3 h-3" /> Time
          </span>
          <span className="text-primary font-medium">
            {formatTimeShort(project.totalTimeSpent)}
          </span>
        </div>
      </div>
    </Card>
  );
}

export function ProjectStatsChart({ projects }: ProjectStatsChartProps) {
  if (projects.length === 0) {
    return null;
  }

  // Prepare data for chart
  // Sort by completion rate (best performing first), then by task count
  const chartData = [...projects]
    .map((p) => ({
      ...p,
      completionRate: p.taskCount > 0 ? (p.completedCount / p.taskCount) * 100 : 0,
    }))
    .sort((a, b) => {
      // First by completion rate (descending)
      if (b.completionRate !== a.completionRate) {
        return b.completionRate - a.completionRate;
      }
      // Then by task count (descending)
      return b.taskCount - a.taskCount;
    })
    .slice(0, 6); // Max 6 projects for readability

  // Calculate dynamic height based on number of projects
  const chartHeight = Math.max(180, chartData.length * 36);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-text-primary text-sm">Projects Overview</h3>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full opacity-40 bg-current" />
            <span className="text-text-muted">Total</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-current" />
            <span className="text-text-muted">Done</span>
          </div>
        </div>
      </div>

      <div style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
            barGap={2}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "var(--text-secondary)" }}
              width={140}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.3 }} />
            {/* Total tasks bar (background) */}
            <Bar dataKey="taskCount" radius={[0, 4, 4, 0]} barSize={16}>
              {chartData.map((entry) => (
                <Cell key={entry.id} fill={entry.color + "30"} />
              ))}
            </Bar>
            {/* Completed tasks bar (foreground) */}
            <Bar dataKey="completedCount" radius={[0, 4, 4, 0]} barSize={16}>
              {chartData.map((entry) => (
                <Cell key={entry.id} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
