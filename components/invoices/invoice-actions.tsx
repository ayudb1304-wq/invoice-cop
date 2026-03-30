"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { MoreHorizontalIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Database } from "@/types/database";

type Invoice = Database["public"]["Tables"]["invoices"]["Row"];

export function InvoiceActions({ invoice }: { invoice: Invoice }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function action(actionType: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionType }),
      });
      if (!res.ok) throw new Error("Request failed");

      const labels: Record<string, string> = {
        mark_paid: "Invoice marked as paid",
        toggle_sequence: invoice.sequence_active
          ? "Reminders paused"
          : "Reminders resumed",
        cancel: "Invoice cancelled",
      };
      toast.success(labels[actionType]);
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const isPaidOrCancelled = ["paid", "cancelled"].includes(invoice.status);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={loading}
        className="hover:bg-accent flex h-8 w-8 items-center justify-center rounded-md transition-colors disabled:opacity-50"
      >
        <MoreHorizontalIcon className="h-4 w-4" />
        <span className="sr-only">Actions</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => router.push(`/invoices/${invoice.id}`)}
        >
          View details
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => router.push(`/invoices/${invoice.id}/edit`)}
          disabled={isPaidOrCancelled}
        >
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {!isPaidOrCancelled && (
          <>
            <DropdownMenuItem onClick={() => action("mark_paid")}>
              Mark as paid
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => action("toggle_sequence")}>
              {invoice.sequence_active ? "Pause reminders" : "Resume reminders"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => action("cancel")}
              className="text-destructive focus:text-destructive"
            >
              Cancel invoice
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
