"use client";

import Link from "next/link";
import { formatDistanceToNow, parseISO } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { InvoiceActions } from "./invoice-actions";
import type { Database } from "@/types/database";

type Invoice = Database["public"]["Tables"]["invoices"]["Row"];

const STATUS_STYLES: Record<string, string> = {
  upcoming: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300",
  due_today: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300",
  overdue: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300",
  paid: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300",
  cancelled: "bg-zinc-50 text-zinc-500 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-500",
};

const STATUS_LABELS: Record<string, string> = {
  upcoming: "Upcoming",
  due_today: "Due today",
  overdue: "Overdue",
  paid: "Paid",
  cancelled: "Cancelled",
};

export function InvoiceTable({ invoices }: { invoices: Invoice[] }) {
  if (invoices.length === 0) {
    return (
      <div className="border-muted rounded-xl border-2 border-dashed py-16 text-center">
        <p className="text-muted-foreground text-sm font-medium">No invoices yet</p>
        <p className="text-muted-foreground mt-1 text-xs">
          Add your first invoice to start sending reminders.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client</TableHead>
            <TableHead>Invoice #</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Due date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Reminders</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell>
                <Link
                  href={`/invoices/${invoice.id}`}
                  className="hover:underline font-medium"
                >
                  {invoice.client_name}
                </Link>
                <div className="text-muted-foreground text-xs">
                  {invoice.client_email}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {invoice.invoice_number ?? "—"}
              </TableCell>
              <TableCell className="font-medium tabular-nums">
                {invoice.currency}{" "}
                {Number(invoice.amount).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </TableCell>
              <TableCell className="text-sm tabular-nums">
                {formatDate(invoice.due_date)}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={STATUS_STYLES[invoice.status]}
                >
                  {STATUS_LABELS[invoice.status]}
                </Badge>
              </TableCell>
              <TableCell>
                {invoice.sequence_active ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                    Active
                  </span>
                ) : (
                  <span className="text-muted-foreground text-xs">Paused</span>
                )}
              </TableCell>
              <TableCell>
                <InvoiceActions invoice={invoice} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}
