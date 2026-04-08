/**
 * Appends compliance footer to every outbound reminder body (plain text).
 * Unsubscribe URL must be the full link line (including label).
 */
export function appendReminderEmailFooter(body: string, unsubscribeUrl: string): string {
  const trimmed = body.trim();
  const stopLine = `To stop receiving reminders for this invoice: ${unsubscribeUrl}`;
  return [
    trimmed,
    "",
    "---",
    "If you've already paid, you can ignore this reminder.",
    "",
    stopLine,
    "",
    "---",
    "This is an automated reminder from InvoiceCop. You are receiving this because your email was added as the recipient for a payment reminder.",
  ].join("\n");
}
