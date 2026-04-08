import { Webhook } from "svix";

/**
 * Verifies Resend webhook signature (Svix). Returns parsed JSON body.
 * When RESEND_WEBHOOK_SECRET is unset (local dev), returns parsed body without verification.
 */
export function verifyAndParseResendWebhook(
  rawBody: string,
  headers: Headers
): Record<string, unknown> {
  const secret = process.env.RESEND_WEBHOOK_SECRET;

  if (secret) {
    const svixId = headers.get("svix-id");
    const svixTimestamp = headers.get("svix-timestamp");
    const svixSignature = headers.get("svix-signature");
    if (!svixId || !svixTimestamp || !svixSignature) {
      throw new Error("Missing Svix signature headers");
    }
    const wh = new Webhook(secret);
    return wh.verify(rawBody, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as Record<string, unknown>;
  }

  console.warn("RESEND_WEBHOOK_SECRET not set — Resend webhook signature not verified");
  return JSON.parse(rawBody) as Record<string, unknown>;
}
