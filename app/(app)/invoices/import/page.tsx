import { CsvImport } from "@/components/invoices/csv-import";
import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";

export const metadata = { title: "Import Invoices" };

export default function ImportPage() {
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
        <h1 className="text-2xl font-semibold tracking-tight">Import invoices</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Upload a CSV file to create multiple invoices at once.
        </p>
      </div>
      <CsvImport />
    </div>
  );
}
