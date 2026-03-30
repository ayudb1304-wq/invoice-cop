import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { startOfMonth, subMonths, format, parseISO } from "date-fns";

type DB = Database;

export interface DashboardStats {
  openCount: number;
  openAmount: number;
  overdueCount: number;
  overdueAmount: number;
  paidThisMonthCount: number;
  paidThisMonthAmount: number;
  activeSequences: number;
  dueSoonCount: number; // next 7 days
}

export interface MonthlyBar {
  month: string; // "Jan", "Feb", etc.
  invoiced: number;
  collected: number;
}

export interface StatusBreakdown {
  status: string;
  label: string;
  count: number;
  amount: number;
  fill: string;
}

export interface UpcomingReminder {
  invoiceId: string;
  clientName: string;
  stage: string;
  scheduledAt: string;
  amount: number;
  currency: string;
}

export async function getDashboardData(supabase: SupabaseClient<DB>) {
  const now = new Date();
  const monthStart = startOfMonth(now).toISOString();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [invoicesRes, jobsRes] = await Promise.all([
    supabase.from("invoices").select("id, amount, currency, status, due_date, sequence_active, created_at, client_name"),
    supabase
      .from("reminder_jobs")
      .select("id, invoice_id, stage, scheduled_at, invoices(client_name, amount, currency)")
      .eq("send_status", "pending")
      .gte("scheduled_at", now.toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(5),
  ]);

  const invoices = invoicesRes.data ?? [];
  const upcomingJobs = jobsRes.data ?? [];

  // ── Stat tiles ─────────────────────────────────────────────────
  const stats: DashboardStats = {
    openCount: 0,
    openAmount: 0,
    overdueCount: 0,
    overdueAmount: 0,
    paidThisMonthCount: 0,
    paidThisMonthAmount: 0,
    activeSequences: 0,
    dueSoonCount: 0,
  };

  for (const inv of invoices) {
    const amount = Number(inv.amount);
    const isOpen = ["upcoming", "due_today", "overdue"].includes(inv.status);

    if (isOpen) {
      stats.openCount++;
      stats.openAmount += amount;
    }
    if (inv.status === "overdue") {
      stats.overdueCount++;
      stats.overdueAmount += amount;
    }
    if (inv.status === "paid" && inv.created_at >= monthStart) {
      stats.paidThisMonthCount++;
      stats.paidThisMonthAmount += amount;
    }
    if (inv.sequence_active && isOpen) {
      stats.activeSequences++;
    }
    if (
      isOpen &&
      inv.due_date >= now.toISOString().split("T")[0] &&
      inv.due_date <= in7Days
    ) {
      stats.dueSoonCount++;
    }
  }

  // ── Monthly bar chart (last 6 months) ──────────────────────────
  const months: MonthlyBar[] = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(now, 5 - i);
    return {
      month: format(d, "MMM"),
      _start: startOfMonth(d).toISOString(),
      _end: startOfMonth(subMonths(d, -1)).toISOString(),
      invoiced: 0,
      collected: 0,
    };
  }) as (MonthlyBar & { _start: string; _end: string })[];

  for (const inv of invoices) {
    for (const m of months as (MonthlyBar & { _start: string; _end: string })[]) {
      if (inv.created_at >= m._start && inv.created_at < m._end) {
        m.invoiced += Number(inv.amount);
      }
      if (inv.status === "paid" && inv.created_at >= m._start && inv.created_at < m._end) {
        m.collected += Number(inv.amount);
      }
    }
  }

  const monthlyBars: MonthlyBar[] = months.map(({ month, invoiced, collected }) => ({
    month,
    invoiced: Math.round(invoiced),
    collected: Math.round(collected),
  }));

  // ── Status donut ───────────────────────────────────────────────
  const statusMap: Record<string, { label: string; fill: string; count: number; amount: number }> = {
    upcoming:  { label: "Upcoming",  fill: "var(--color-upcoming)",  count: 0, amount: 0 },
    due_today: { label: "Due today", fill: "var(--color-due_today)", count: 0, amount: 0 },
    overdue:   { label: "Overdue",   fill: "var(--color-overdue)",   count: 0, amount: 0 },
    paid:      { label: "Paid",      fill: "var(--color-paid)",      count: 0, amount: 0 },
    cancelled: { label: "Cancelled", fill: "var(--color-cancelled)", count: 0, amount: 0 },
  };

  for (const inv of invoices) {
    if (statusMap[inv.status]) {
      statusMap[inv.status].count++;
      statusMap[inv.status].amount += Number(inv.amount);
    }
  }

  const statusBreakdown: StatusBreakdown[] = Object.entries(statusMap)
    .filter(([, v]) => v.count > 0)
    .map(([status, v]) => ({ status, ...v, amount: Math.round(v.amount) }));

  // ── Recent invoices (last 5) ───────────────────────────────────
  const recentInvoices = [...invoices]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 5);

  // ── Upcoming reminders ─────────────────────────────────────────
  const upcomingReminders: UpcomingReminder[] = upcomingJobs.map((job) => {
    const inv = (job as { invoices: { client_name: string; amount: number; currency: string } }).invoices;
    return {
      invoiceId: job.invoice_id,
      clientName: inv?.client_name ?? "Unknown",
      stage: job.stage,
      scheduledAt: job.scheduled_at,
      amount: Number(inv?.amount ?? 0),
      currency: inv?.currency ?? "USD",
    };
  });

  return { stats, monthlyBars, statusBreakdown, recentInvoices, upcomingReminders };
}
