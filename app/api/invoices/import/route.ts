import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createInvoice } from "@/lib/db/invoices";
import { csvRowSchema } from "@/lib/validations/invoice";
import type { ReminderStage } from "@/types/database";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { rows: Record<string, string>[] };
  const { rows } = body;

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "No rows provided" }, { status: 422 });
  }

  const defaultStages: ReminderStage[] = [
    "pre_due_7", "pre_due_3", "due_today", "overdue_3", "overdue_10",
  ];

  const results = await Promise.allSettled(
    rows.map(async (row, index) => {
      const parsed = csvRowSchema.safeParse(row);
      if (!parsed.success) {
        return {
          index,
          success: false,
          errors: parsed.error.flatten().fieldErrors,
        };
      }

      const d = parsed.data;
      const { data, error } = await createInvoice(
        supabase,
        {
          client_name: d.client_name,
          client_email: d.client_email,
          invoice_number: d.invoice_number ?? null,
          amount: d.amount,
          currency: d.currency,
          due_date: d.due_date,
          payment_link_url: d.payment_link || null,
          internal_notes: d.notes ?? null,
        },
        user.id,
        defaultStages
      );

      if (error) return { index, success: false, errors: { _: [error.message] } };
      return { index, success: true, id: data?.id };
    })
  );

  const succeeded = results.filter(
    (r) => r.status === "fulfilled" && r.value.success
  ).length;

  const failed = results
    .map((r, i) =>
      r.status === "fulfilled" && !r.value.success
        ? { row: i + 1, errors: r.value.errors }
        : null
    )
    .filter(Boolean);

  return NextResponse.json({ succeeded, failed, total: rows.length });
}

export async function GET() {
  // Return CSV template
  const headers = [
    "client_name",
    "client_email",
    "amount",
    "currency",
    "due_date",
    "invoice_number",
    "payment_link",
    "notes",
  ].join(",");

  const example = [
    "Acme Corp",
    "billing@acme.com",
    "2500.00",
    "USD",
    "2026-04-15",
    "INV-001",
    "https://pay.example.com/inv001",
    "Q1 design work",
  ].join(",");

  const csv = `${headers}\n${example}`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="invoicecop-template.csv"',
    },
  });
}
