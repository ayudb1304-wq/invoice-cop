import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ArrowRightIcon } from "lucide-react";
import type { Database } from "@/types/database";

type Invoice = Pick<
  Database["public"]["Tables"]["invoices"]["Row"],
  "id" | "client_name" | "amount" | "currency" | "status" | "due_date"
>;

const STATUS_STYLES: Record<string, string> = {
  upcoming:  "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300",
  due_today: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300",
  overdue:   "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300",
  paid:      "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300",
  cancelled: "bg-zinc-50 text-zinc-500 border-zinc-200 dark:bg-zinc-900",
};

const STATUS_LABELS: Record<string, string> = {
  upcoming: "Upcoming", due_today: "Due today", overdue: "Overdue",
  paid: "Paid", cancelled: "Cancelled",
};

export function RecentInvoices({ invoices }: { invoices: Invoice[] }) {
  return (
    <div className="rounded-2xl border p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Recent invoices</h2>
          <p className="text-muted-foreground text-xs">Last 5 added</p>
        </div>
        <Link
          href="/invoices"
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors"
        >
          View all <ArrowRightIcon className="h-3 w-3" />
        </Link>
      </div>

      {invoices.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">No invoices yet.</p>
      ) : (
        <div className="divide-y">
          {invoices.map((inv) => (
            <Link
              key={inv.id}
              href={`/invoices/${inv.id}`}
              className="flex items-center justify-between gap-4 py-3 hover:opacity-80 transition-opacity"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{inv.client_name}</p>
                <p className="text-muted-foreground text-xs tabular-nums">
                  Due {formatDate(inv.due_date)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Badge variant="outline" className={STATUS_STYLES[inv.status]}>
                  {STATUS_LABELS[inv.status]}
                </Badge>
                <span className="text-sm font-semibold tabular-nums">
                  {inv.currency} {Number(inv.amount).toLocaleString("en-US", { minimumFractionDigits: 0 })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "short", day: "numeric",
  });
}
