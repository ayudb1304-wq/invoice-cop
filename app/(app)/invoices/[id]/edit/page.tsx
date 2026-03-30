import { createClient } from "@/utils/supabase/server";
import { getInvoiceById } from "@/lib/db/invoices";
import { notFound } from "next/navigation";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";

export const metadata = { title: "Edit Invoice" };

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { id } = await params;
  const { data: invoice, error } = await getInvoiceById(supabase, id);

  if (error || !invoice) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <Link
          href={`/invoices/${id}`}
          className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm transition-colors"
        >
          <ChevronLeftIcon className="h-3.5 w-3.5" />
          Invoice details
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Edit invoice</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Update invoice details. Reminder schedule is not changed on edit.
        </p>
      </div>
      <InvoiceForm invoice={invoice} />
    </div>
  );
}
