import { NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/server";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe";
import { logEvent } from "@/lib/db/invoices";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token") ?? "";
  const invoiceId = searchParams.get("invoice_id") ?? "";

  // Token encodes the invoice ID — extract it from the token itself
  // (token is HMAC of invoiceId, so we need invoiceId in the URL too)
  if (!token || !invoiceId || !verifyUnsubscribeToken(invoiceId, token)) {
    return new Response(
      "<html><body><p>Invalid or expired unsubscribe link.</p></body></html>",
      { headers: { "Content-Type": "text/html" } }
    );
  }

  const supabase = createServiceClient();

  // Cancel all pending jobs for this invoice
  await supabase
    .from("reminder_jobs")
    .update({ send_status: "cancelled" })
    .eq("invoice_id", invoiceId)
    .eq("send_status", "pending");

  await supabase
    .from("invoices")
    .update({ sequence_active: false })
    .eq("id", invoiceId);

  await logEvent(
    supabase,
    invoiceId,
    "unsubscribed",
    "Client unsubscribed — all future reminders cancelled"
  );

  return new Response(
    `<html>
      <body style="font-family:sans-serif;max-width:480px;margin:80px auto;padding:0 24px;text-align:center">
        <h2>You've been unsubscribed</h2>
        <p style="color:#666">You will no longer receive automated payment reminders for this invoice.</p>
        <p style="color:#666;font-size:14px">If this was a mistake, please contact the sender directly.</p>
      </body>
    </html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}
