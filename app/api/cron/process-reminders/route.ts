import { NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/server";
import { processReminders } from "@/lib/scheduler/process";

export const maxDuration = 60; // Vercel Pro max for cron

export async function GET(request: Request) {
  // Protect endpoint — Vercel passes Authorization header with CRON_SECRET
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const result = await processReminders(supabase);

  return NextResponse.json({
    ok: true,
    processed: result.processed,
    errors: result.errors,
    timestamp: new Date().toISOString(),
  });
}
