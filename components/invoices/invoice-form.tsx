"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { invoiceSchema, REMINDER_STAGES, type InvoiceFormValues } from "@/lib/validations/invoice";
import type { Database } from "@/types/database";

type Invoice = Database["public"]["Tables"]["invoices"]["Row"];

const STAGE_LABELS: Record<string, string> = {
  pre_due_7: "7 days before due",
  pre_due_3: "3 days before due",
  due_today: "On due date",
  overdue_3: "3 days after due",
  overdue_10: "10 days after due",
};

const CURRENCIES = ["USD", "EUR", "GBP", "INR", "CAD", "AUD", "SGD"];

interface Props {
  invoice?: Invoice;
}

export function InvoiceForm({ invoice }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const isEdit = !!invoice;

  const form = useForm<InvoiceFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(invoiceSchema) as any,
    defaultValues: {
      client_name: invoice?.client_name ?? "",
      client_email: invoice?.client_email ?? "",
      invoice_number: invoice?.invoice_number ?? "",
      amount: invoice?.amount ?? ("" as unknown as number),
      currency: invoice?.currency ?? "USD",
      due_date: invoice?.due_date ?? "",
      payment_link_url: invoice?.payment_link_url ?? "",
      internal_notes: invoice?.internal_notes ?? "",
      sequence_stages: ["pre_due_7", "pre_due_3", "due_today", "overdue_3", "overdue_10"],
    },
  });

  async function onSubmit(values: InvoiceFormValues) {
    setSubmitting(true);
    try {
      const url = isEdit ? `/api/invoices/${invoice.id}` : "/api/invoices";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Something went wrong");
        return;
      }

      toast.success(isEdit ? "Invoice updated" : "Invoice created — reminders scheduled");
      router.push(`/invoices/${json.data.id}`);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Client */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Client
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="client_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Corp" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="client_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client email *</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="billing@acme.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        {/* Invoice details */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Invoice
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="invoice_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice number</FormLabel>
                  <FormControl>
                    <Input placeholder="INV-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-3 gap-2">
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CURRENCIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Amount *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="2500.00"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? undefined
                              : Number(e.target.value)
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due date *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="payment_link_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment link</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://pay.stripe.com/..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="internal_notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Internal notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Q1 design project — 3 milestones"
                    rows={2}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        {/* Reminder sequence */}
        {!isEdit && (
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Reminder sequence
            </h2>
            <p className="text-muted-foreground text-sm">
              Select which reminders to send. Stages already in the past will be
              skipped automatically.
            </p>
            <FormField
              control={form.control}
              name="sequence_stages"
              render={({ field }) => (
                <FormItem>
                  <div className="space-y-2">
                    {REMINDER_STAGES.map((stage) => (
                      <label
                        key={stage}
                        className="flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors hover:bg-accent"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded"
                          checked={field.value.includes(stage)}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...field.value, stage]
                              : field.value.filter((s) => s !== stage);
                            field.onChange(next);
                          }}
                        />
                        <span className="text-sm font-medium">
                          {STAGE_LABELS[stage]}
                        </span>
                      </label>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>
        )}

        {/* Submit */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="bg-foreground text-background rounded-md px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            {submitting
              ? "Saving…"
              : isEdit
              ? "Update invoice"
              : "Create invoice"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="hover:bg-accent rounded-md px-5 py-2.5 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </Form>
  );
}
