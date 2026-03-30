import Link from "next/link";
import { BellIcon, ArrowRightIcon } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import type { UpcomingReminder } from "@/lib/db/dashboard";

const STAGE_LABELS: Record<string, string> = {
  pre_due_7: "7-day reminder",
  pre_due_3: "3-day reminder",
  due_today: "Due-date email",
  overdue_3: "3-day overdue",
  overdue_10: "10-day overdue",
};

const STAGE_ACCENT: Record<string, string> = {
  pre_due_7: "text-blue-500",
  pre_due_3: "text-blue-600",
  due_today: "text-amber-500",
  overdue_3: "text-orange-500",
  overdue_10: "text-red-600",
};

export function UpcomingReminders({ reminders }: { reminders: UpcomingReminder[] }) {
  return (
    <div className="rounded-2xl border p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Upcoming reminders</h2>
          <p className="text-muted-foreground text-xs">Next 5 scheduled</p>
        </div>
        <Link
          href="/invoices"
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors"
        >
          View all <ArrowRightIcon className="h-3 w-3" />
        </Link>
      </div>

      {reminders.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <BellIcon className="text-muted-foreground/40 h-8 w-8" />
          <p className="text-muted-foreground text-sm">No reminders scheduled.</p>
        </div>
      ) : (
        <div className="divide-y">
          {reminders.map((r) => (
            <Link
              key={`${r.invoiceId}-${r.stage}`}
              href={`/invoices/${r.invoiceId}`}
              className="flex items-center justify-between gap-4 py-3 transition-opacity hover:opacity-80"
            >
              <div className="flex items-center gap-3 min-w-0">
                <BellIcon
                  className={`h-3.5 w-3.5 shrink-0 ${STAGE_ACCENT[r.stage] ?? "text-muted-foreground"}`}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{r.clientName}</p>
                  <p className={`text-xs ${STAGE_ACCENT[r.stage] ?? "text-muted-foreground"}`}>
                    {STAGE_LABELS[r.stage] ?? r.stage}
                  </p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs font-medium tabular-nums">
                  {r.currency} {Number(r.amount).toLocaleString("en-US", { minimumFractionDigits: 0 })}
                </p>
                <p className="text-muted-foreground text-xs tabular-nums">
                  {formatDistanceToNow(parseISO(r.scheduledAt), { addSuffix: true })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
