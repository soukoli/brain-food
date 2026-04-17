/**
 * Seed Script - Creates demo data for BrainFood
 *
 * Usage: npx tsx scripts/seed.ts
 *
 * This will create demo projects and ideas for the test user.
 * Run this after setting up the database and creating a test user.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { projects, ideas, users } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

// Demo data configuration
const DEMO_PROJECTS = [
  {
    name: "Side Project Ideas",
    description: "Collection of app and business ideas to explore",
    color: "#6366f1", // Primary purple
  },
  {
    name: "Learning & Growth",
    description: "Skills to learn and courses to take",
    color: "#22c55e", // Green
  },
  {
    name: "Home Improvements",
    description: "Tasks and projects around the house",
    color: "#f97316", // Orange
  },
  {
    name: "Health & Fitness",
    description: "Exercise routines and health goals",
    color: "#ef4444", // Red
  },
  {
    name: "Reading List",
    description: "Books and articles to read",
    color: "#0ea5e9", // Blue
  },
];

const DEMO_IDEAS = [
  // Side Project Ideas
  {
    projectIndex: 0,
    title: "Build a habit tracking app",
    description: "Simple mobile app to track daily habits with streaks and reminders",
    priority: "high" as const,
    status: "inbox" as const,
  },
  {
    projectIndex: 0,
    title: "Create a recipe sharing platform",
    description: "Social platform for sharing family recipes with automatic grocery lists",
    priority: "medium" as const,
    status: "inbox" as const,
  },
  {
    projectIndex: 0,
    title: "Podcast episode idea tracker",
    description: "Tool to save interesting podcast episodes with notes and timestamps",
    priority: "low" as const,
    status: "inbox" as const,
  },

  // Learning & Growth
  {
    projectIndex: 1,
    title: "Complete TypeScript advanced course",
    description: "Finish the advanced TypeScript patterns course on Frontend Masters",
    priority: "high" as const,
    status: "in-progress" as const,
    timeSpentSeconds: 3600, // 1 hour already
  },
  {
    projectIndex: 1,
    title: "Learn Rust basics",
    description: "Go through the Rust book and build a simple CLI tool",
    priority: "medium" as const,
    status: "inbox" as const,
  },
  {
    projectIndex: 1,
    title: "Practice system design interviews",
    description: "Work through common system design problems weekly",
    priority: "urgent" as const,
    status: "in-progress" as const,
    scheduledForToday: true,
  },

  // Home Improvements
  {
    projectIndex: 2,
    title: "Fix leaky kitchen faucet",
    description: "Replace the washer and check the valve",
    priority: "high" as const,
    status: "inbox" as const,
  },
  {
    projectIndex: 2,
    title: "Organize garage",
    description: "Install shelving and sort through boxes",
    priority: "medium" as const,
    status: "inbox" as const,
  },
  {
    projectIndex: 2,
    title: "Paint bedroom walls",
    description: "Choose a calming color and repaint the master bedroom",
    priority: "low" as const,
    status: "completed" as const,
    timeSpentSeconds: 14400, // 4 hours
  },

  // Health & Fitness
  {
    projectIndex: 3,
    title: "Morning yoga routine",
    description: "15-minute stretching routine before work",
    priority: "medium" as const,
    status: "in-progress" as const,
    scheduledForToday: true,
  },
  {
    projectIndex: 3,
    title: "Research protein supplements",
    description: "Find the best protein powder for post-workout recovery",
    priority: "low" as const,
    status: "inbox" as const,
  },
  {
    projectIndex: 3,
    title: "Sign up for 5K run",
    description: "Register for the local charity 5K in March",
    priority: "high" as const,
    status: "completed" as const,
  },

  // Reading List
  {
    projectIndex: 4,
    title: "Atomic Habits by James Clear",
    description: "Learn about building good habits and breaking bad ones",
    priority: "high" as const,
    status: "in-progress" as const,
    timeSpentSeconds: 7200, // 2 hours
  },
  {
    projectIndex: 4,
    title: "The Pragmatic Programmer",
    description: "Classic software development book, 20th anniversary edition",
    priority: "medium" as const,
    status: "inbox" as const,
  },
  {
    projectIndex: 4,
    title: "Deep Work by Cal Newport",
    description: "Strategies for focused success in a distracted world",
    priority: "medium" as const,
    status: "completed" as const,
    timeSpentSeconds: 10800, // 3 hours
  },

  // Quick ideas (no project)
  {
    projectIndex: null,
    title: "Check out that new coffee shop downtown",
    description: null,
    priority: null,
    status: "inbox" as const,
  },
  {
    projectIndex: null,
    title: "Call dentist for appointment",
    description: "Schedule annual checkup",
    priority: "medium" as const,
    status: "inbox" as const,
    scheduledForToday: true,
  },
  {
    projectIndex: null,
    title: "Research vacation spots for summer",
    description: "Look into beach destinations in Europe",
    priority: "low" as const,
    status: "inbox" as const,
  },
];

async function seed() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("❌ DATABASE_URL is not set");
    console.log("   Set DATABASE_URL in .env.local and try again");
    process.exit(1);
  }

  console.log("🌱 Starting seed...\n");

  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);

  try {
    // Find the test user or first user
    const existingUsers = await db.select().from(users).limit(1);

    if (existingUsers.length === 0) {
      console.error("❌ No users found in database");
      console.log("   Please sign in first to create a user, then run seed again");
      process.exit(1);
    }

    const userId = existingUsers[0].id;
    console.log(`📧 Using user: ${existingUsers[0].email || existingUsers[0].name || userId}`);

    // Check if user already has data
    const existingProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId))
      .limit(1);

    if (existingProjects.length > 0) {
      console.log("\n⚠️  User already has projects. Do you want to add more demo data?");
      console.log("   To reset, delete existing projects first.");
      console.log("   Continuing with seed anyway...\n");
    }

    // Create projects
    console.log("📁 Creating projects...");
    const createdProjects: { id: string }[] = [];

    for (let i = 0; i < DEMO_PROJECTS.length; i++) {
      const project = DEMO_PROJECTS[i];
      const [created] = await db
        .insert(projects)
        .values({
          name: project.name,
          description: project.description,
          color: project.color,
          userId,
          sortOrder: i,
        })
        .returning({ id: projects.id });

      createdProjects.push(created);
      console.log(`   ✓ ${project.name}`);
    }

    // Create ideas
    console.log("\n💡 Creating ideas...");
    let ideasCreated = 0;

    for (const idea of DEMO_IDEAS) {
      const projectId = idea.projectIndex !== null ? createdProjects[idea.projectIndex].id : null;

      await db.insert(ideas).values({
        title: idea.title,
        description: idea.description,
        projectId,
        userId,
        status: idea.status,
        priority: idea.priority,
        timeSpentSeconds: idea.timeSpentSeconds || 0,
        scheduledForToday: idea.scheduledForToday ? new Date() : null,
        completedAt: idea.status === "completed" ? new Date() : null,
      });

      ideasCreated++;
    }

    console.log(`   ✓ Created ${ideasCreated} ideas`);

    console.log("\n✅ Seed completed successfully!");
    console.log(`   ${DEMO_PROJECTS.length} projects`);
    console.log(`   ${ideasCreated} ideas`);
    console.log("\n🚀 Open http://localhost:3002 to see your demo data");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
