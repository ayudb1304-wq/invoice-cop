import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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

  const result = await resend.emails.send({
    from: `InvoiceCop <${fromEmail}>`,
    to,
    replyTo: replyTo,
    subject,
    text: `${body}\n\n---\nTo stop receiving reminders for this invoice: ${appUrl}/api/unsubscribe?token=${replyToToken}`,
    headers: {
      "X-Invoice-ID": invoiceId,
    },
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data;
}
