import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      "postgresql://postgres:postgres@localhost:5433/brain_food_dev",
  },
  verbose: true,
  strict: true,
});
