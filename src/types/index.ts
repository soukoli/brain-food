import type { Idea, Project } from "@/lib/db/schema";

/**
 * Idea with project relation
 */
export interface IdeaWithProject extends Idea {
  project: Project | null;
}

/**
 * Project with idea count
 */
export interface ProjectWithCount extends Project {
  ideaCount: number;
}

/**
 * Project with its ideas (for combined view)
 */
export interface ProjectWithIdeas extends Project {
  ideas: Idea[];
}

/**
 * Dashboard statistics
 */
export interface DashboardStats {
  projectCount: number;
  todayCount: number;
  totalTasks: number;
  inProgressCount: number;
}

/**
 * Recent project for dashboard carousel
 */
export interface RecentProject {
  id: string;
  name: string;
  color: string;
  totalTimeSpent: number; // Total time spent on all tasks in project
  lastActivityAt: Date; // When was the project last modified
}

/**
 * Project stats for comparison chart
 */
export interface ProjectStats {
  id: string;
  name: string;
  color: string;
  taskCount: number;
  completedCount: number;
  inProgressCount: number;
  totalTimeSpent: number;
  lastActivityAt: Date;
}

/**
 * Timer state
 */
export interface TimerState {
  isRunning: boolean;
  seconds: number;
  lastStartedAt: Date | null;
}

/**
 * API response types
 */
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Filter options for ideas
 */
export interface IdeaFilters {
  projectId?: string;
  status?: string;
  priority?: string;
  scheduledForToday?: boolean;
  search?: string;
}

/**
 * Sort options
 */
export type SortDirection = "asc" | "desc";

export interface SortOption {
  field: string;
  direction: SortDirection;
}
