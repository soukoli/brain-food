/**
 * Project color palette
 * 12 colors for visual distinction
 */
export const PROJECT_COLORS = [
  { name: "Blue", value: "#3B82F6" },
  { name: "Red", value: "#EF4444" },
  { name: "Green", value: "#22C55E" },
  { name: "Yellow", value: "#EAB308" },
  { name: "Purple", value: "#A855F7" },
  { name: "Pink", value: "#EC4899" },
  { name: "Orange", value: "#F97316" },
  { name: "Teal", value: "#14B8A6" },
  { name: "Indigo", value: "#6366F1" },
  { name: "Cyan", value: "#06B6D4" },
  { name: "Lime", value: "#84CC16" },
  { name: "Rose", value: "#F43F5E" },
] as const;

export type ProjectColor = (typeof PROJECT_COLORS)[number];

/**
 * Idea status values
 */
export const IDEA_STATUSES = {
  INBOX: "inbox",
  IN_PROGRESS: "in-progress",
  COMPLETED: "completed",
  ARCHIVED: "archived",
  DELETED: "deleted",
} as const;

export type IdeaStatus = (typeof IDEA_STATUSES)[keyof typeof IDEA_STATUSES];

/**
 * Priority values
 */
export const PRIORITIES = [
  { value: "urgent", label: "Urgent", color: "#EF4444" },
  { value: "high", label: "High", color: "#F97316" },
  { value: "medium", label: "Medium", color: "#EAB308" },
  { value: "low", label: "Low", color: "#22C55E" },
] as const;

export type Priority = (typeof PRIORITIES)[number]["value"];

/**
 * Capture methods
 */
export const CAPTURE_METHODS = {
  TEXT: "text",
  VOICE: "voice",
  LINK: "link",
} as const;

export type CaptureMethod = (typeof CAPTURE_METHODS)[keyof typeof CAPTURE_METHODS];

/**
 * Project status values
 */
export const PROJECT_STATUSES = {
  ACTIVE: "active",
  ARCHIVED: "archived",
  COMPLETED: "completed",
} as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[keyof typeof PROJECT_STATUSES];

/**
 * Default focus warning threshold (2 hours in seconds)
 */
export const DEFAULT_FOCUS_WARNING_THRESHOLD = 7200;

/**
 * Navigation items for tab bar
 */
export const NAV_ITEMS = [
  { href: "/", label: "Home", icon: "Home" },
  { href: "/projects", label: "Projects", icon: "Folder" },
  { href: "/focus", label: "Focus", icon: "Target" },
  { href: "/capture", label: "Capture", icon: "Plus" },
] as const;
