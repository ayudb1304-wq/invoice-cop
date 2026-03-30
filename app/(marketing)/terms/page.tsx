import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-24">
      <Link href="/" className="text-muted-foreground hover:text-foreground mb-8 inline-block text-sm transition-colors">
        ← InvoiceCop
      </Link>
      <h1 className="mb-6 text-3xl font-black tracking-tight">Terms of Service</h1>
      <p className="text-muted-foreground text-sm">
        Full terms of service coming soon. InvoiceCop is an automation tool
        and is not a financial institution. Users are responsible for ensuring
        their use complies with applicable laws and email regulations.
      </p>
    </div>
  );
}
