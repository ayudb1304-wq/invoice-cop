import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-24">
      <Link href="/" className="text-muted-foreground hover:text-foreground mb-8 inline-block text-sm transition-colors">
        ← InvoiceCop
      </Link>
      <h1 className="mb-6 text-3xl font-black tracking-tight">Privacy Policy</h1>
      <p className="text-muted-foreground text-sm">
        Full privacy policy coming soon. InvoiceCop stores only the invoice
        metadata and payment URLs you provide. We do not store payment
        credentials. Your data is never sold to third parties.
      </p>
    </div>
  );
}
