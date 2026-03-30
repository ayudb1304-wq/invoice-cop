import { NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/server";
import { updateInvoiceStatuses } from "@/lib/scheduler/process";

export const maxDuration = 30;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  await updateInvoiceStatuses(supabase);

  return NextResponse.json({ ok: true, timestamp: new Date().toISOString() });
}
