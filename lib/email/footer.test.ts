import { describe, expect, it } from "vitest";
import { appendReminderEmailFooter } from "./footer";

describe("appendReminderEmailFooter", () => {
  it("appends standard disclaimer, unsubscribe, and legal block", () => {
    const out = appendReminderEmailFooter(
      "Hi there,\n\nPay please.",
      "https://app.example.com/api/unsubscribe?token=abc&invoice_id=uuid"
    );
    expect(out).toContain("Hi there");
    expect(out).toContain("If you've already paid");
    expect(out).toContain("To stop receiving reminders for this invoice:");
    expect(out).toContain("token=abc");
    expect(out).toContain("This is an automated reminder from InvoiceCop");
  });
});
