import { createClient } from "@/utils/supabase/server";
import { getInvoices } from "@/lib/db/invoices";
import { InvoiceTable } from "@/components/invoices/invoice-table";
import { InvoiceFilters } from "@/components/invoices/invoice-filters";
import Link from "next/link";
import { PlusIcon, UploadIcon } from "lucide-react";
import type { InvoiceStatus } from "@/types/database";

export const metadata = { title: "Invoices" };

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>;
}) {
  const supabase = await createClient();
  const sp = await searchParams;

  const { data: invoices, count } = await getInvoices(supabase, {
    status: (sp.status as InvoiceStatus) ?? "all",
    search: sp.search,
    page: Number(sp.page ?? 1),
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {count ?? 0} total
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/invoices/import"
            className="border-input hover:bg-accent flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors"
          >
            <UploadIcon className="h-3.5 w-3.5" />
            Import CSV
          </Link>
          <Link
            href="/invoices/new"
            className="bg-foreground text-background flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-opacity hover:opacity-80"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Add invoice
          </Link>
        </div>
      </div>

      <InvoiceFilters currentStatus={sp.status} currentSearch={sp.search} />

      <InvoiceTable invoices={invoices ?? []} />
    </div>
  );
}
