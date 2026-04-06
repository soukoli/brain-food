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
 * Dashboard statistics
 */
export interface DashboardStats {
  projectCount: number;
  todayCount: number;
  inboxCount: number;
  inProgressCount: number;
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
