/**
 * Database Status Script
 *
 * Shows current database connection status and migration info.
 *
 * Usage:
 *   npm run db:status
 */

import { Pool } from "pg";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// Load env vars
dotenv.config({ path: ".env.local" });

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

async function main() {
  console.log("📊 Database Status");
  console.log("==================");
  console.log("");

  // Check local migrations
  const migrationsDir = path.join(process.cwd(), "drizzle");
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  console.log(`📂 Local migration files (${migrationFiles.length}):`);
  migrationFiles.forEach((f) => console.log(`   - ${f}`));
  console.log("");

  if (!DATABASE_URL) {
    console.log("❌ No DATABASE_URL found. Set it in .env.local");
    return;
  }

  // Parse connection info
  const url = new URL(DATABASE_URL);
  const isNeon = DATABASE_URL.includes("neon.tech");
  const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";

  console.log(`🔌 Connection:`);
  console.log(`   Host: ${url.hostname}`);
  console.log(`   Database: ${url.pathname.slice(1)}`);
  console.log(`   Type: ${isNeon ? "Neon (Production)" : isLocal ? "Local Docker" : "Other"}`);
  console.log("");

  // Test connection
  const pool = new Pool({
    host: url.hostname,
    port: url.port ? parseInt(url.port) : 5432,
    user: url.username,
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    ssl: isLocal ? false : { rejectUnauthorized: false },
    max: 1,
  });

  try {
    console.log("🔍 Testing connection...");
    const result = await pool.query("SELECT current_database(), current_user, version()");
    console.log(`   ✅ Connected!`);
    console.log(`   Database: ${result.rows[0].current_database}`);
    console.log(`   User: ${result.rows[0].current_user}`);
    console.log("");

    // Check applied migrations
    try {
      const migrations = await pool.query(`
        SELECT * FROM __drizzle_migrations 
        ORDER BY created_at DESC 
        LIMIT 10
      `);
      console.log(`📋 Applied migrations (${migrations.rowCount}):`);
      migrations.rows.forEach((m: { hash: string; created_at: Date }) => {
        console.log(`   - ${m.hash} (${new Date(m.created_at).toISOString()})`);
      });
    } catch {
      console.log("📋 No migrations table found (database is empty or using db:push)");
    }
    console.log("");

    // List tables
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log(`📦 Tables (${tables.rowCount}):`);
    tables.rows.forEach((t: { table_name: string }) => {
      console.log(`   - ${t.table_name}`);
    });
  } catch (error) {
    console.error("❌ Connection failed:", error);
  } finally {
    await pool.end();
  }
}

main();
