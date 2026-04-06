import { NextResponse } from "next/server";
import { healthCheck } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const isHealthy = await healthCheck();

    if (isHealthy) {
      return NextResponse.json({
        status: "healthy",
        database: "connected",
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      {
        status: "unhealthy",
        database: "disconnected",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
