import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getTemplatesForUser, createTemplate } from "@/lib/db/templates";
import { z } from "zod";
import type { ReminderStage } from "@/types/database";

const createSchema = z.object({
  stage: z.enum(["pre_due_7", "pre_due_3", "due_today", "overdue_3", "overdue_10"]),
  tone_tag: z.string().default("friendly"),
  subject_template: z.string().min(1),
  body_template: z.string().min(1),
});

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await getTemplatesForUser(supabase, user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const { data, error } = await createTemplate(supabase, {
    owner_id: user.id,
    stage: parsed.data.stage as ReminderStage,
    tone_tag: parsed.data.tone_tag,
    subject_template: parsed.data.subject_template,
    body_template: parsed.data.body_template,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
