/**
 * Migration script that runs during Vercel build
 *
 * This is called from package.json build script:
 * "build": "tsx scripts/migrate.ts && next build"
 *
 * It safely applies pending migrations before the app builds.
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import * as path from "path";

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

// Skip migrations during local development if no DB URL
// (local dev uses db:push or db:migrate directly)
if (!DATABASE_URL) {
  console.log("⏭️  No DATABASE_URL found, skipping migrations");
  console.log("   (This is normal for local development)");
  process.exit(0);
}

// Skip if explicitly disabled
if (process.env.SKIP_MIGRATIONS === "true") {
  console.log("⏭️  SKIP_MIGRATIONS=true, skipping migrations");
  process.exit(0);
}

async function runMigrations() {
  console.log("🚀 Running database migrations...");

  // Parse connection string for logging (hide password)
  try {
    const url = new URL(DATABASE_URL!);
    console.log(`   Database: ${url.hostname}${url.pathname}`);
  } catch {
    console.log("   Database: [connection string]");
  }

  // Create connection with proper SSL for cloud databases
  const pool = new Pool({
    connectionString: DATABASE_URL!,
    ssl: DATABASE_URL!.includes("localhost") ? false : { rejectUnauthorized: false },
    max: 1,
    connectionTimeoutMillis: 10000,
  });

  try {
    // Test connection
    await pool.query("SELECT 1");
    console.log("   ✅ Connected");

    // Run migrations
    const db = drizzle(pool);
    await migrate(db, {
      migrationsFolder: path.join(process.cwd(), "drizzle"),
    });

    console.log("   ✅ Migrations complete");
  } catch (error) {
    console.error("❌ Migration failed:", error);

    // Don't fail the build if it's just "no migrations to run"
    if (error instanceof Error && error.message.includes("No migrations")) {
      console.log("   (No pending migrations)");
      process.exit(0);
    }

    // Handle case where tables already exist (relation already exists)
    if (
      error instanceof Error &&
      (error.message.includes("already exists") ||
        error.message.includes("relation") ||
        error.message.includes("duplicate"))
    ) {
      console.log("   ⚠️ Tables already exist, skipping migration");
      console.log("   (This is expected if database was set up with db:push)");
      process.exit(0);
    }

    // Fail build on real errors
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
