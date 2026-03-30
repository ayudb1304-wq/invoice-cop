import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, ReminderStage } from "@/types/database";
import { sendReminderEmail } from "@/lib/email/send";
import { getTemplate, buildTemplateVars, mergeTemplate } from "@/lib/email/templates";
import { generateUnsubscribeToken } from "@/lib/email/unsubscribe";
import { logEvent } from "@/lib/db/invoices";

type DB = Database;

export async function processReminders(supabase: SupabaseClient<DB>) {
  // Fetch up to 50 pending jobs due now, with their invoices
  const { data: jobs, error } = await supabase
    .from("reminder_jobs")
    .select("*, invoices(*)")
    .eq("send_status", "pending")
    .lte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(50);

  if (error || !jobs) return { processed: 0, errors: [] };

  const errors: string[] = [];
  let processed = 0;

  for (const job of jobs) {
    const invoice = (job as { invoices: DB["public"]["Tables"]["invoices"]["Row"] }).invoices;
    if (!invoice) continue;

    // Skip if invoice is paid/cancelled or sequence is paused
    if (["paid", "cancelled"].includes(invoice.status) || !invoice.sequence_active) {
      await supabase
        .from("reminder_jobs")
        .update({ send_status: "skipped" })
        .eq("id", job.id);
      continue;
    }

    // Check owner subscription is still valid
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_status, trial_ends_at")
      .eq("id", invoice.owner_id)
      .single();

    if (!isAllowedToSend(profile)) {
      await supabase
        .from("reminder_jobs")
        .update({ send_status: "skipped", last_error: "Account subscription inactive" })
        .eq("id", job.id);
      continue;
    }

    // Atomic lock: only proceed if still pending (prevents double-send on concurrent runs)
    const { data: locked } = await supabase
      .from("reminder_jobs")
      .update({ send_status: "sending", attempts: (job.attempts ?? 0) + 1 })
      .eq("id", job.id)
      .eq("send_status", "pending")
      .select("id");

    if (!locked || locked.length === 0) continue; // Another worker claimed it

    try {
      const template = await getTemplate(supabase, job.stage as ReminderStage, invoice.owner_id);
      const unsubToken = generateUnsubscribeToken(invoice.id);
      const vars = buildTemplateVars(invoice, unsubToken);
      const merged = mergeTemplate(template, vars);

      const result = await sendReminderEmail({
        to: invoice.client_email,
        subject: merged.subject,
        body: merged.body,
        invoiceId: invoice.id,
        replyToToken: unsubToken,
      });

      await supabase
        .from("reminder_jobs")
        .update({
          send_status: "sent",
          sent_at: new Date().toISOString(),
          resend_message_id: result?.id ?? null,
        })
        .eq("id", job.id);

      await logEvent(
        supabase,
        invoice.id,
        "reminder_sent",
        `${STAGE_LABELS[job.stage] ?? job.stage} reminder sent to ${invoice.client_email}`,
        { job_id: job.id, resend_id: result?.id }
      );

      processed++;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const attempts = (job.attempts ?? 0) + 1;
      const nextStatus = attempts >= 3 ? "failed" : "pending";

      await supabase
        .from("reminder_jobs")
        .update({ send_status: nextStatus, last_error: errMsg })
        .eq("id", job.id);

      errors.push(`Job ${job.id}: ${errMsg}`);
    }
  }

  return { processed, errors };
}

export async function updateInvoiceStatuses(supabase: SupabaseClient<DB>) {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  // upcoming → due_today
  await supabase
    .from("invoices")
    .update({ status: "due_today" })
    .eq("status", "upcoming")
    .eq("due_date", today);

  // upcoming/due_today → overdue (past due date, not yet paid)
  await supabase
    .from("invoices")
    .update({ status: "overdue" })
    .in("status", ["upcoming", "due_today"])
    .lt("due_date", today);
}

function isAllowedToSend(
  profile: { subscription_status: string; trial_ends_at: string | null } | null
): boolean {
  if (!profile) return false;
  if (profile.subscription_status === "active") return true;
  if (profile.subscription_status === "trialing") {
    return profile.trial_ends_at ? new Date(profile.trial_ends_at) > new Date() : false;
  }
  return false;
}

const STAGE_LABELS: Record<string, string> = {
  pre_due_7: "7-day pre-due",
  pre_due_3: "3-day pre-due",
  due_today: "Due-date",
  overdue_3: "3-day overdue",
  overdue_10: "10-day overdue",
};
