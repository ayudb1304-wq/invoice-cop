import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createInvoice, getInvoices } from "@/lib/db/invoices";
import { invoiceSchema } from "@/lib/validations/invoice";
import type { InvoiceStatus, ReminderStage } from "@/types/database";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as InvoiceStatus | "all" | null;
  const search = searchParams.get("search") ?? undefined;
  const page = Number(searchParams.get("page") ?? 1);

  const { data, error, count } = await getInvoices(supabase, {
    status: status ?? "all",
    search,
    page,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, count });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = invoiceSchema.safeParse({
    ...body,
    amount: Number(body.amount),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { sequence_stages, ...invoiceData } = parsed.data;

  const { data, error } = await createInvoice(
    supabase,
    {
      ...invoiceData,
      payment_link_url: invoiceData.payment_link_url || null,
      invoice_number: invoiceData.invoice_number || null,
      internal_notes: invoiceData.internal_notes || null,
    },
    user.id,
    sequence_stages as ReminderStage[]
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
