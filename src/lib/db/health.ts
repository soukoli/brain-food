import { getPoolAsync } from "./index";

export async function healthCheck(): Promise<boolean> {
  try {
    const pool = await getPoolAsync();
    await pool.query("SELECT 1");
    return true;
  } catch (error) {
    console.error("Database health check failed:", error);
    return false;
  }
}
