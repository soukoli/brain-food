import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { AdapterAccountType } from "@auth/core/adapters";

/**
 * Users Table (NextAuth managed)
 * Stores user profile information from OAuth providers
 */
export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * OAuth Accounts Table (NextAuth managed)
 * Links OAuth provider accounts to users
 */
export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

/**
 * Sessions Table (NextAuth managed)
 * Stores active user sessions
 */
export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

/**
 * Projects Table
 * Represents user projects for organizing ideas
 */
export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    color: varchar("color", { length: 50 }).default("#3B82F6").notNull(),
    status: varchar("status", { length: 50 })
      .default("active")
      .notNull()
      .$type<"active" | "archived" | "completed">(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    // Index for listing user's projects sorted by creation date
    userIdCreatedAtIdx: index("projects_user_id_created_at_idx").on(table.userId, table.createdAt),
  })
);

/**
 * Ideas Table
 * Represents captured ideas/tasks with time tracking
 */
export const ideas = pgTable(
  "ideas",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Content fields
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"), // Markdown-enabled description
    linkUrl: varchar("link_url", { length: 2048 }), // Optional link
    voiceTranscript: text("voice_transcript"), // Transcript from voice input

    // Organization
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Status and priority
    status: varchar("status", { length: 50 })
      .default("inbox")
      .notNull()
      .$type<"inbox" | "in-progress" | "completed" | "archived" | "deleted">(),
    priority: varchar("priority", { length: 50 }).$type<"low" | "medium" | "high" | "urgent">(),

    // Capture method
    captureMethod: varchar("capture_method", { length: 50 })
      .default("text")
      .$type<"text" | "voice" | "link">(),

    // AI processing (for future use)
    aiProcessed: boolean("ai_processed").default(false).notNull(),
    aiMetadata: jsonb("ai_metadata").$type<Record<string, unknown>>(),

    // Time tracking
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    timeSpentSeconds: integer("time_spent_seconds").default(0).notNull(),
    isTimerRunning: boolean("is_timer_running").default(false).notNull(),
    lastTimerStartedAt: timestamp("last_timer_started_at", { withTimezone: true }),
    focusWarningThreshold: integer("focus_warning_threshold").default(7200).notNull(), // 2 hours default

    // Daily planning
    scheduledForToday: timestamp("scheduled_for_today", { withTimezone: true }),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    // Index for listing user's ideas sorted by creation date
    userIdCreatedAtIdx: index("ideas_user_id_created_at_idx").on(table.userId, table.createdAt),
    // Index for filtering by project
    projectIdIdx: index("ideas_project_id_idx").on(table.projectId),
    // Index for filtering by status (inbox, in-progress, etc.)
    userIdStatusIdx: index("ideas_user_id_status_idx").on(table.userId, table.status),
    // Index for daily focus view (scheduled for today)
    scheduledForTodayIdx: index("ideas_scheduled_for_today_idx").on(table.scheduledForToday),
  })
);

/**
 * Tags Table
 * Represents tags for categorizing ideas
 */
export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Idea-Tags Junction Table
 * Many-to-many relationship between ideas and tags
 */
export const ideaTags = pgTable(
  "idea_tags",
  {
    ideaId: uuid("idea_id")
      .notNull()
      .references(() => ideas.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.ideaId, table.tagId] }),
    };
  }
);

/**
 * Relations - Users
 */
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  projects: many(projects),
  ideas: many(ideas),
  tags: many(tags),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

/**
 * Relations - Projects & Ideas
 */
export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  ideas: many(ideas),
}));

export const ideasRelations = relations(ideas, ({ one, many }) => ({
  user: one(users, {
    fields: [ideas.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [ideas.projectId],
    references: [projects.id],
  }),
  ideaTags: many(ideaTags),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
  user: one(users, {
    fields: [tags.userId],
    references: [users.id],
  }),
  ideaTags: many(ideaTags),
}));

export const ideaTagsRelations = relations(ideaTags, ({ one }) => ({
  idea: one(ideas, {
    fields: [ideaTags.ideaId],
    references: [ideas.id],
  }),
  tag: one(tags, {
    fields: [ideaTags.tagId],
    references: [tags.id],
  }),
}));

/**
 * Type exports
 */
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type Idea = typeof ideas.$inferSelect;
export type NewIdea = typeof ideas.$inferInsert;

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;

export type IdeaTag = typeof ideaTags.$inferSelect;
export type NewIdeaTag = typeof ideaTags.$inferInsert;
