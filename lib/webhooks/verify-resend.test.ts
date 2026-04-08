import { describe, expect, it, vi, afterEach } from "vitest";
import { verifyAndParseResendWebhook } from "./verify-resend";

describe("verifyAndParseResendWebhook", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("parses JSON when RESEND_WEBHOOK_SECRET is unset", () => {
    vi.stubEnv("RESEND_WEBHOOK_SECRET", "");
    const raw = JSON.stringify({ type: "email.received", data: { to: ["a@b.com"] } });
    const headers = new Headers();
    const parsed = verifyAndParseResendWebhook(raw, headers);
    expect(parsed.type).toBe("email.received");
    expect((parsed.data as { to: string[] }).to).toEqual(["a@b.com"]);
  });
});
