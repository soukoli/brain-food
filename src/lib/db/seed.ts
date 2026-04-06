import { getDbAsync } from "@/lib/db";

async function seed() {
  console.log("Starting seed...");

  try {
    await getDbAsync();

    // Note: This seed script is for development only
    // In production, data is created through the app

    console.log("Seed completed successfully!");
    console.log("\nTo use the app:");
    console.log("1. Sign in with Google");
    console.log("2. Create projects from the Projects page");
    console.log("3. Add ideas using the Capture feature");
    console.log("4. Schedule ideas for today and track time in Focus view");
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

seed();
