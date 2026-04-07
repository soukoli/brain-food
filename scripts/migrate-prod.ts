/**
 * Production Migration Script
 *
 * This script applies Drizzle migrations to the production database (Neon).
 *
 * Usage:
 *   npm run db:migrate:prod
 *
 * Prerequisites:
 *   1. Run `vercel env pull .env.production` to get production env vars
 *   2. Or set DATABASE_URL environment variable manually
 *
 * How it works:
 *   1. Connects to production database using DATABASE_URL
 *   2. Reads migration files from ./drizzle folder
 *   3. Applies pending migrations in order
 *   4. Tracks applied migrations in __drizzle_migrations table
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import * as dotenv from "dotenv";
import * as path from "path";
import * as readline from "readline";

// Try to load production env vars
dotenv.config({ path: ".env.production" });
dotenv.config({ path: ".env.local" });

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not found!");
  console.error("");
  console.error("To run production migrations:");
  console.error("  1. Run: vercel env pull .env.production");
  console.error("  2. Then: npm run db:migrate:prod");
  console.error("");
  console.error("Or set DATABASE_URL manually:");
  console.error('  DATABASE_URL="postgresql://..." npm run db:migrate:prod');
  process.exit(1);
}

// Check if this looks like a production database
const isProduction =
  DATABASE_URL.includes("neon.tech") ||
  DATABASE_URL.includes("supabase") ||
  DATABASE_URL.includes("aws") ||
  DATABASE_URL.includes("vercel");

async function confirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${message} (y/N): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y");
    });
  });
}

async function main() {
  console.log("🚀 Drizzle Production Migration");
  console.log("================================");
  console.log("");

  // Parse and display connection info (without password)
  const url = new URL(DATABASE_URL!);
  console.log(`📦 Database: ${url.hostname}${url.pathname}`);
  console.log(`👤 User: ${url.username}`);
  console.log(`🔒 SSL: enabled`);
  console.log("");

  if (isProduction) {
    console.log("⚠️  WARNING: This is a PRODUCTION database!");
    console.log("");
    const confirmed = await confirm("Do you want to continue?");
    if (!confirmed) {
      console.log("❌ Migration cancelled.");
      process.exit(0);
    }
    console.log("");
  }

  // Create connection pool with proper SSL settings
  const pool = new Pool({
    host: url.hostname,
    port: url.port ? parseInt(url.port) : 5432,
    user: url.username,
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    ssl: { rejectUnauthorized: false },
    max: 1,
  });

  try {
    // Test connection
    console.log("🔌 Connecting to database...");
    await pool.query("SELECT 1");
    console.log("✅ Connected successfully!");
    console.log("");

    // Run migrations
    console.log("📂 Running migrations from ./drizzle ...");
    const db = drizzle(pool);

    await migrate(db, {
      migrationsFolder: path.join(process.cwd(), "drizzle"),
    });

    console.log("");
    console.log("✅ Migrations completed successfully!");
  } catch (error) {
    console.error("");
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
