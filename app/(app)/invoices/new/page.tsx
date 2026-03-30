import { InvoiceForm } from "@/components/invoices/invoice-form";
import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";

export const metadata = { title: "New Invoice" };

export default function NewInvoicePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <Link
          href="/invoices"
          className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm transition-colors"
        >
          <ChevronLeftIcon className="h-3.5 w-3.5" />
          Invoices
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">New invoice</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Add an invoice and schedule automated reminder emails.
        </p>
      </div>
      <InvoiceForm />
    </div>
  );
}
