import { Resend } from "resend";
import { appendReminderEmailFooter } from "@/lib/email/footer";

/** Lazy init so `next build` does not require RESEND_API_KEY when this module is imported via cron/scheduler. */
function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("RESEND_API_KEY is not set");
  }
  return new Resend(key);
}

export interface SendReminderOptions {
  to: string;
  subject: string;
  body: string;
  invoiceId: string;
  replyToToken: string;
}

export async function sendReminderEmail({
  to,
  subject,
  body,
  invoiceId,
  replyToToken,
}: SendReminderOptions) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://invoicecop.com";
  const fromEmail = process.env.FROM_EMAIL ?? "reminders@invoicecop.com";

  // Per-invoice reply-to address for inbound reply detection
  const replyTo = `reply+${invoiceId}@${new URL(appUrl).hostname}`;
  const unsubscribeUrl = `${appUrl}/api/unsubscribe?token=${replyToToken}&invoice_id=${invoiceId}`;
  const textBody = appendReminderEmailFooter(body, unsubscribeUrl);

  const result = await getResend().emails.send({
    from: `InvoiceCop <${fromEmail}>`,
    to,
    replyTo: replyTo,
    subject,
    text: textBody,
    headers: {
      "X-Invoice-ID": invoiceId,
    },
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data;
}
