import { createClient } from "@/utils/supabase/server";
import { getInvoiceWithEvents } from "@/lib/db/invoices";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { InvoiceActions } from "@/components/invoices/invoice-actions";
import { SequenceTimeline } from "@/components/invoices/sequence-timeline";
import { ActivityLog } from "@/components/invoices/activity-log";

export const metadata = { title: "Invoice Details" };

const STATUS_STYLES: Record<string, string> = {
  upcoming: "bg-blue-50 text-blue-700 border-blue-200",
  due_today: "bg-amber-50 text-amber-700 border-amber-200",
  overdue: "bg-red-50 text-red-700 border-red-200",
  paid: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-zinc-50 text-zinc-500 border-zinc-200",
};

const STATUS_LABELS: Record<string, string> = {
  upcoming: "Upcoming",
  due_today: "Due today",
  overdue: "Overdue",
  paid: "Paid",
  cancelled: "Cancelled",
};

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { id } = await params;
  const { invoice, events, jobs, error } = await getInvoiceWithEvents(supabase, id);

  if (error || !invoice) notFound();

  const amount = Number(invoice.amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      {/* Back */}
      <Link
        href="/invoices"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
      >
        <ChevronLeftIcon className="h-3.5 w-3.5" />
        Invoices
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {invoice.client_name}
            </h1>
            <Badge
              variant="outline"
              className={STATUS_STYLES[invoice.status]}
            >
              {STATUS_LABELS[invoice.status]}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">{invoice.client_email}</p>
        </div>
        <InvoiceActions invoice={invoice} />
      </div>

      {/* Key details */}
      <div className="grid grid-cols-2 gap-4 rounded-xl border p-6 sm:grid-cols-4">
        <Stat label="Amount">
          {invoice.currency} {amount}
        </Stat>
        <Stat label="Due date">
          {new Date(invoice.due_date + "T00:00:00").toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </Stat>
        <Stat label="Invoice #">{invoice.invoice_number ?? "—"}</Stat>
        <Stat label="Reminders">
          {invoice.sequence_active ? (
            <span className="inline-flex items-center gap-1.5 font-medium text-green-600">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              Active
            </span>
          ) : (
            <span className="text-muted-foreground">Paused</span>
          )}
        </Stat>
        {invoice.payment_link_url && (
          <div className="col-span-2 sm:col-span-4">
            <p className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wider">
              Payment link
            </p>
            <a
              href={invoice.payment_link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm underline underline-offset-2 break-all"
            >
              {invoice.payment_link_url}
            </a>
          </div>
        )}
        {invoice.internal_notes && (
          <div className="col-span-2 sm:col-span-4">
            <p className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wider">
              Notes
            </p>
            <p className="text-sm">{invoice.internal_notes}</p>
          </div>
        )}
      </div>

      {/* Reminder sequence timeline */}
      <section>
        <h2 className="mb-4 text-sm font-semibold">Reminder schedule</h2>
        <SequenceTimeline jobs={jobs} />
      </section>

      {/* Activity log */}
      <section>
        <h2 className="mb-4 text-sm font-semibold">Activity</h2>
        <ActivityLog events={events} />
      </section>
    </div>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wider">
        {label}
      </p>
      <p className="text-sm font-medium">{children}</p>
    </div>
  );
}
