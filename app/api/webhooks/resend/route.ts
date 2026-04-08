import { NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/server";
import { logEvent } from "@/lib/db/invoices";
import { verifyAndParseResendWebhook } from "@/lib/webhooks/verify-resend";

// Resend sends inbound email events as POST to this endpoint (Svix-signed).
// We match the invoice by the reply-to address pattern: reply+{invoiceId}@domain
export async function POST(request: Request) {
  const rawBody = await request.text();

  let envelope: Record<string, unknown>;
  try {
    envelope = verifyAndParseResendWebhook(rawBody, request.headers);
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  const data = (envelope.data ?? envelope) as {
    to?: string[];
    from?: string;
    subject?: string;
  };

  const supabase = createServiceClient();

  const toAddresses: string[] = data.to ?? [];
  const invoiceId = extractInvoiceId(toAddresses);

  if (!invoiceId) {
    return NextResponse.json({ ok: true });
  }

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
      { from: data.from, subject: data.subject }
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
