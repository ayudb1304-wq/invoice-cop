import { createHmac } from "crypto";

const SECRET = process.env.CRON_SECRET ?? "dev-secret";

export function generateUnsubscribeToken(invoiceId: string): string {
  return createHmac("sha256", SECRET).update(invoiceId).digest("hex");
}

export function verifyUnsubscribeToken(invoiceId: string, token: string): boolean {
  const expected = generateUnsubscribeToken(invoiceId);
  // Constant-time comparison
  if (expected.length !== token.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ token.charCodeAt(i);
  }
  return mismatch === 0;
}
