import { z } from "zod";

/**
 * Project validation schema
 */
export const projectSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name is too long"),
  description: z.string().max(2000, "Description is too long").optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
});

export const createProjectSchema = projectSchema;

export const updateProjectSchema = projectSchema.partial().extend({
  sortOrder: z.number().int().min(0).optional(),
});

/**
 * Idea validation schema
 */
export const ideaSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title is too long"),
  description: z.string().max(10000, "Description is too long").optional().nullable(),
  linkUrl: z.string().url("Invalid URL").max(2048).optional().nullable(),
  voiceTranscript: z.string().max(10000).optional().nullable(),
  projectId: z.string().uuid("Invalid project ID").optional().nullable(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional().nullable(),
  captureMethod: z.enum(["text", "voice", "link"]).default("text"),
  scheduledForToday: z.string().datetime().optional().nullable(),
});

export const createIdeaSchema = ideaSchema;

export const updateIdeaSchema = ideaSchema.partial().extend({
  status: z.enum(["inbox", "in-progress", "completed", "archived", "deleted"]).optional(),
  scheduledForToday: z.string().datetime().optional().nullable(),
});

/**
 * Timer action schema
 */
export const timerActionSchema = z.object({
  action: z.enum(["start", "pause", "complete"]),
});

/**
 * Schedule idea schema
 */
export const scheduleIdeaSchema = z.object({
  ideaId: z.string().uuid("Invalid idea ID"),
  date: z.string().datetime().optional(), // If not provided, schedules for today
});

/**
 * Tag validation schema
 */
export const tagSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateIdeaInput = z.infer<typeof createIdeaSchema>;
export type UpdateIdeaInput = z.infer<typeof updateIdeaSchema>;
export type TimerActionInput = z.infer<typeof timerActionSchema>;
export type ScheduleIdeaInput = z.infer<typeof scheduleIdeaSchema>;
export type CreateTagInput = z.infer<typeof tagSchema>;
