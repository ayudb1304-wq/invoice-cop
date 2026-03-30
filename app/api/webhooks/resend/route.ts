import { NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/server";
import { logEvent } from "@/lib/db/invoices";

// Resend sends inbound email events as POST to this endpoint.
// We match the invoice by the reply-to address pattern: reply+{invoiceId}@domain
export async function POST(request: Request) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

  // Verify webhook signature if secret is configured
  if (webhookSecret) {
    const signature = request.headers.get("svix-signature") ?? "";
    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }
    // Signature verification can be added here using the Resend webhook library
    // For MVP we verify by secret presence; full verification in Phase 11
  }

  const body = await request.json();
  const supabase = createServiceClient();

  // Extract invoice ID from the "to" address (reply+{invoiceId}@domain)
  const toAddresses: string[] = body.to ?? [];
  const invoiceId = extractInvoiceId(toAddresses);

  if (!invoiceId) {
    // Not a reply we can match — ignore
    return NextResponse.json({ ok: true });
  }

  // Pause sequence and log the reply
  const { error } = await supabase
    .from("invoices")
    .update({ sequence_active: false })
    .eq("id", invoiceId);

  if (!error) {
    await logEvent(
      supabase,
      invoiceId,
      "reply_detected",
      "Client replied — reminder sequence paused automatically",
      { from: body.from, subject: body.subject }
    );
  }

  return NextResponse.json({ ok: true });
}

function extractInvoiceId(toAddresses: string[]): string | null {
  for (const address of toAddresses) {
    const match = address.match(/reply\+([a-f0-9-]{36})@/);
    if (match) return match[1];
  }
  return null;
}
