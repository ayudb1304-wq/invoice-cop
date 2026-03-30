"use client";

import { mergeTemplate, type TemplateVars } from "@/lib/email/templates";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Database } from "@/types/database";

type Template = Database["public"]["Tables"]["email_templates"]["Row"];

const SAMPLE_VARS: TemplateVars = {
  client_name: "Jane Smith",
  invoice_number: "INV-042",
  amount: "2,500.00",
  currency: "USD",
  due_date: "April 15, 2026",
  payment_link: "https://pay.example.com/inv042",
  sender_name: "InvoiceCop",
  days_overdue: "3",
  unsubscribe_link: "https://invoicecop.com/unsubscribe?token=example",
};

export function TemplatePreview({
  template,
  onClose,
}: {
  template: Template;
  onClose: () => void;
}) {
  const merged = mergeTemplate(template, SAMPLE_VARS);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Template preview</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="rounded-lg border p-4">
            <p className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wider">
              Subject
            </p>
            <p className="text-sm font-medium">{merged.subject}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wider">
              Body
            </p>
            <pre className="text-sm leading-relaxed whitespace-pre-wrap">
              {merged.body}
            </pre>
          </div>
          <p className="text-muted-foreground text-xs">
            Previewed with sample data.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
