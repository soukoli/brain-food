/**
 * Database Connection with Drizzle ORM
 * Supports both local development (DATABASE_URL) and AWS IAM auth (production)
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Singleton instances
let pool: Pool | undefined;
let db: ReturnType<typeof drizzle<typeof schema>> | undefined;

/**
 * Check if we're using AWS IAM authentication
 */
function isAwsIamAuth(): boolean {
  return !!(
    process.env.AWS_ROLE_ARN &&
    process.env.PGHOST &&
    !process.env.DATABASE_URL &&
    !process.env.POSTGRES_URL
  );
}

/**
 * Create pool with AWS IAM authentication
 */
async function createAwsIamPool(): Promise<Pool> {
  // Dynamic imports for AWS SDK (only needed in production)
  const { Signer } = await import("@aws-sdk/rds-signer");
  const { awsCredentialsProvider } = await import("@vercel/functions/oidc");
  const { attachDatabasePool } = await import("@vercel/functions");

  const signer = new Signer({
    hostname: process.env.PGHOST!,
    port: Number(process.env.PGPORT || 5432),
    username: process.env.PGUSER!,
    region: process.env.AWS_REGION!,
    credentials: awsCredentialsProvider({
      roleArn: process.env.AWS_ROLE_ARN!,
      clientConfig: { region: process.env.AWS_REGION! },
    }),
  });

  const newPool = new Pool({
    host: process.env.PGHOST,
    user: process.env.PGUSER,
    database: process.env.PGDATABASE || "postgres",
    password: () => signer.getAuthToken(),
    port: Number(process.env.PGPORT || 5432),
    ssl: { rejectUnauthorized: false },
    max: 20,
  });

  // Attach pool for Vercel Functions lifecycle management
  attachDatabasePool(newPool);

  return newPool;
}

/**
 * Create pool with connection string (local development)
 */
function createConnectionStringPool(): Pool {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (!connectionString) {
    throw new Error(
      "Missing database connection. Set DATABASE_URL, POSTGRES_URL, or configure AWS IAM auth (AWS_ROLE_ARN, PGHOST, etc.)"
    );
  }

  return new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  });
}

/**
 * Check if we're in build phase (no DB needed)
 */
function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

/**
 * Get or create database connection pool
 */
export async function getPoolAsync(): Promise<Pool> {
  if (!pool) {
    if (isBuildPhase()) {
      throw new Error("Database not available during build phase");
    }
    if (isAwsIamAuth()) {
      console.log("Using AWS IAM authentication for database");
      pool = await createAwsIamPool();
    } else {
      console.log("Using connection string for database");
      pool = createConnectionStringPool();
    }
  }
  return pool;
}

/**
 * Get pool synchronously (for backwards compatibility)
 */
export function getPool(): Pool {
  if (!pool) {
    if (isBuildPhase()) {
      throw new Error("Database not available during build phase");
    }
    if (isAwsIamAuth()) {
      throw new Error(
        "AWS IAM pool not initialized. Call getPoolAsync() first or use getDbAsync()."
      );
    }
    pool = createConnectionStringPool();
  }
  return pool;
}

/**
 * Get Drizzle database instance (async version)
 */
export async function getDbAsync() {
  if (!db) {
    const poolInstance = await getPoolAsync();
    db = drizzle(poolInstance, { schema });
  }
  return db;
}

/**
 * Get Drizzle database instance (sync version)
 */
export function getDb() {
  if (!db) {
    if (isBuildPhase()) {
      throw new Error("Database not available during build phase");
    }
    if (isAwsIamAuth() && !pool) {
      throw new Error("For AWS IAM auth, use getDbAsync() instead of getDb()");
    }
    const poolInstance = getPool();
    db = drizzle(poolInstance, { schema });
  }
  return db;
}

/**
 * Health check - verifies database connection
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const poolInstance = await getPoolAsync();
    await poolInstance.query("SELECT 1");
    return true;
  } catch (error) {
    console.error("Database health check failed:", error);
    return false;
  }
}

/**
 * Close database connections (for graceful shutdown)
 */
export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = undefined;
    db = undefined;
  }
}

// Export schema for direct access
export { schema };

// Export types from schema
export type {
  Project,
  NewProject,
  Idea,
  NewIdea,
  Tag,
  NewTag,
  IdeaTag,
  NewIdeaTag,
  User,
  NewUser,
  Account,
  NewAccount,
  Session,
  NewSession,
} from "./schema";
