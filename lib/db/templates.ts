import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, ReminderStage } from "@/types/database";

type DB = Database;

export async function getTemplatesForUser(
  supabase: SupabaseClient<DB>,
  ownerId: string
) {
  return supabase
    .from("email_templates")
    .select("*")
    .or(`owner_id.eq.${ownerId},owner_id.is.null`)
    .order("stage")
    .order("owner_id", { ascending: false });
}

export async function createTemplate(
  supabase: SupabaseClient<DB>,
  data: {
    owner_id: string;
    stage: ReminderStage;
    tone_tag: string;
    subject_template: string;
    body_template: string;
  }
) {
  return supabase.from("email_templates").insert(data).select().single();
}

export async function updateTemplate(
  supabase: SupabaseClient<DB>,
  id: string,
  data: { subject_template?: string; body_template?: string; tone_tag?: string }
) {
  return supabase
    .from("email_templates")
    .update(data)
    .eq("id", id)
    .select()
    .single();
}

export async function deleteTemplate(
  supabase: SupabaseClient<DB>,
  id: string
) {
  return supabase.from("email_templates").delete().eq("id", id);
}
