import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, InvoiceStatus, ReminderStage } from "@/types/database";
import { addDays, format, parseISO, isBefore, startOfDay } from "date-fns";

type DB = Database;
type InvoiceInsert = DB["public"]["Tables"]["invoices"]["Insert"];
type Invoice = DB["public"]["Tables"]["invoices"]["Row"];

// ── Stage offsets (days relative to due_date) ──────────────────
const STAGE_OFFSETS: Record<ReminderStage, number> = {
  pre_due_7: -7,
  pre_due_3: -3,
  due_today: 0,
  overdue_3: 3,
  overdue_10: 10,
};

// ── Helpers ────────────────────────────────────────────────────

export async function getInvoices(
  supabase: SupabaseClient<DB>,
  {
    status,
    search,
    page = 1,
    pageSize = 20,
  }: {
    status?: InvoiceStatus | "all";
    search?: string;
    page?: number;
    pageSize?: number;
  } = {}
) {
  let query = supabase
    .from("invoices")
    .select("*", { count: "exact" })
    .order("due_date", { ascending: true })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (status && status !== "all") query = query.eq("status", status);
  if (search) {
    query = query.or(
      `client_name.ilike.%${search}%,client_email.ilike.%${search}%,invoice_number.ilike.%${search}%`
    );
  }

  return query;
}

export async function getInvoiceById(
  supabase: SupabaseClient<DB>,
  id: string
) {
  return supabase.from("invoices").select("*").eq("id", id).single();
}

export async function createInvoice(
  supabase: SupabaseClient<DB>,
  data: Omit<InvoiceInsert, "owner_id">,
  ownerId: string,
  stages: ReminderStage[] = ["pre_due_7", "pre_due_3", "due_today", "overdue_3", "overdue_10"]
) {
  // 1. Insert invoice
  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({ ...data, owner_id: ownerId })
    .select()
    .single();

  if (error || !invoice) return { data: null, error };

  // 2. Generate sequence rows + job rows for each enabled stage
  await generateSequenceJobs(supabase, invoice, stages);

  return { data: invoice, error: null };
}

export async function updateInvoice(
  supabase: SupabaseClient<DB>,
  id: string,
  data: Partial<InvoiceInsert>
) {
  return supabase
    .from("invoices")
    .update(data)
    .eq("id", id)
    .select()
    .single();
}

export async function markInvoicePaid(
  supabase: SupabaseClient<DB>,
  id: string
) {
  // Cancel all pending jobs
  await supabase
    .from("reminder_jobs")
    .update({ send_status: "cancelled" })
    .eq("invoice_id", id)
    .eq("send_status", "pending");

  // Update invoice status
  const result = await supabase
    .from("invoices")
    .update({ status: "paid", sequence_active: false })
    .eq("id", id)
    .select()
    .single();

  // Log event
  await logEvent(supabase, id, "status_changed", "Invoice marked as paid");

  return result;
}

export async function cancelInvoice(
  supabase: SupabaseClient<DB>,
  id: string
) {
  await supabase
    .from("reminder_jobs")
    .update({ send_status: "cancelled" })
    .eq("invoice_id", id)
    .eq("send_status", "pending");

  return supabase
    .from("invoices")
    .update({ status: "cancelled", sequence_active: false })
    .eq("id", id)
    .select()
    .single();
}

export async function getInvoiceWithEvents(
  supabase: SupabaseClient<DB>,
  id: string
): Promise<{
  invoice: DB["public"]["Tables"]["invoices"]["Row"] | null;
  events: DB["public"]["Tables"]["invoice_events"]["Row"][];
  jobs: DB["public"]["Tables"]["reminder_jobs"]["Row"][];
  error: { message: string } | null;
}> {
  const [invoiceRes, eventsRes, jobsRes] = await Promise.all([
    supabase.from("invoices").select("*").eq("id", id).single(),
    supabase
      .from("invoice_events")
      .select("*")
      .eq("invoice_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("reminder_jobs")
      .select("*")
      .eq("invoice_id", id)
      .order("scheduled_at", { ascending: true }),
  ]);

  return {
    invoice: invoiceRes.data as DB["public"]["Tables"]["invoices"]["Row"] | null,
    events: (eventsRes.data ?? []) as DB["public"]["Tables"]["invoice_events"]["Row"][],
    jobs: (jobsRes.data ?? []) as DB["public"]["Tables"]["reminder_jobs"]["Row"][],
    error: invoiceRes.error,
  };
}

export async function getDashboardStats(supabase: SupabaseClient<DB>) {
  const { data, error } = await supabase.from("invoices").select("amount, status, due_date");
  if (error || !data) return null;

  const today = startOfDay(new Date());
  const in7Days = addDays(today, 7);

  return {
    openCount: data.filter((i) =>
      ["upcoming", "due_today", "overdue"].includes(i.status)
    ).length,
    openAmount: data
      .filter((i) => ["upcoming", "due_today", "overdue"].includes(i.status))
      .reduce((s, i) => s + Number(i.amount), 0),
    overdueCount: data.filter((i) => i.status === "overdue").length,
    overdueAmount: data
      .filter((i) => i.status === "overdue")
      .reduce((s, i) => s + Number(i.amount), 0),
    dueSoonCount: data.filter(
      (i) =>
        i.status === "upcoming" &&
        !isBefore(parseISO(i.due_date), today) &&
        isBefore(parseISO(i.due_date), in7Days)
    ).length,
  };
}

// ── Internal helpers ───────────────────────────────────────────

async function generateSequenceJobs(
  supabase: SupabaseClient<DB>,
  invoice: Invoice,
  stages: ReminderStage[]
) {
  const now = new Date();
  const dueDate = parseISO(invoice.due_date);

  const sequenceRows = stages.map((stage) => {
    const scheduledAt = addDays(dueDate, STAGE_OFFSETS[stage]);
    // Schedule at 09:00 UTC
    scheduledAt.setUTCHours(9, 0, 0, 0);
    return {
      invoice_id: invoice.id,
      stage,
      enabled: true,
      scheduled_at: scheduledAt.toISOString(),
    };
  });

  const { data: sequences, error } = await supabase
    .from("invoice_sequences")
    .insert(sequenceRows)
    .select();

  if (error || !sequences) return;

  // Only create jobs for future schedules
  const jobRows = sequences
    .filter((seq) => new Date(seq.scheduled_at) > now)
    .map((seq) => ({
      invoice_id: invoice.id,
      sequence_id: seq.id,
      stage: seq.stage as ReminderStage,
      scheduled_at: seq.scheduled_at,
      send_status: "pending" as const,
    }));

  if (jobRows.length > 0) {
    await supabase.from("reminder_jobs").insert(jobRows);
  }
}

export async function logEvent(
  supabase: SupabaseClient<DB>,
  invoiceId: string,
  eventType: string,
  description: string,
  metadata?: Record<string, unknown>
) {
  await supabase.from("invoice_events").insert({
    invoice_id: invoiceId,
    event_type: eventType,
    description,
    metadata: (metadata ?? null) as import("@/types/database").Json | null,
  });
}
