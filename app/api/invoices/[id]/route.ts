import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  getInvoiceWithEvents,
  updateInvoice,
  markInvoicePaid,
  cancelInvoice,
  logEvent,
} from "@/lib/db/invoices";
import { invoiceSchema } from "@/lib/validations/invoice";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await getInvoiceWithEvents(supabase, id);

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 404 });
  if (result.invoice?.owner_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(result);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  // Handle special actions
  if (body.action === "mark_paid") {
    const { data, error } = await markInvoicePaid(supabase, id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  }

  if (body.action === "cancel") {
    const { data, error } = await cancelInvoice(supabase, id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  }

  if (body.action === "toggle_sequence") {
    const { data: invoice } = await supabase
      .from("invoices")
      .select("sequence_active")
      .eq("id", id)
      .single();

    const newState = !invoice?.sequence_active;
    const { data, error } = await updateInvoice(supabase, id, {
      sequence_active: newState,
    });
    await logEvent(
      supabase,
      id,
      "sequence_toggled",
      newState ? "Reminder sequence resumed" : "Reminder sequence paused"
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  }

  // General field update
  const parsed = invoiceSchema.partial().safeParse({
    ...body,
    amount: body.amount !== undefined ? Number(body.amount) : undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { sequence_stages, ...updateData } = parsed.data;
  const { data, error } = await updateInvoice(supabase, id, updateData);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { error } = await cancelInvoice(supabase, id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
