"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const STATUSES = [
  { value: "all", label: "All" },
  { value: "upcoming", label: "Upcoming" },
  { value: "due_today", label: "Due today" },
  { value: "overdue", label: "Overdue" },
  { value: "paid", label: "Paid" },
];

export function InvoiceFilters({
  currentStatus,
  currentSearch,
}: {
  currentStatus?: string;
  currentSearch?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`/invoices?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Status tabs */}
      <div className="bg-muted flex rounded-lg p-1">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => updateFilter("status", s.value)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              (currentStatus ?? "all") === s.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        type="search"
        placeholder="Search clients…"
        defaultValue={currentSearch}
        onChange={(e) => updateFilter("search", e.target.value)}
        className="border-input bg-background placeholder:text-muted-foreground h-8 rounded-md border px-3 text-sm focus:outline-none focus:ring-1"
      />
    </div>
  );
}
