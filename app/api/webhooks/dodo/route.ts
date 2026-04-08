import { NextResponse } from "next/server";
import DodoPayments from "dodopayments";
import { createServiceClient } from "@/utils/supabase/server";
import {
  findUserIdByEmail,
  resolveUserIdFromDodoSubscription,
  syncProfileFromDodoSubscription,
} from "@/lib/billing/dodo";
import type { Subscription } from "dodopayments/resources/subscriptions";

export const dynamic = "force-dynamic";

function collectStandardWebhookHeaders(request: Request): Record<string, string> {
  const keys = ["webhook-id", "webhook-signature", "webhook-timestamp"] as const;
  const out: Record<string, string> = {};
  for (const k of keys) {
    const v = request.headers.get(k);
    if (v) out[k] = v;
  }
  return out;
}

function isSubscriptionEvent(type: string): boolean {
  return type.startsWith("subscription.");
}

function getSubscriptionPayload(event: { type: string; data: unknown }): Subscription | null {
  if (!isSubscriptionEvent(event.type)) return null;
  return event.data as Subscription;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const apiKey = process.env.DODO_PAYMENTS_API_KEY;
  const webhookKey = process.env.DODO_PAYMENTS_WEBHOOK_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "DODO_PAYMENTS_API_KEY not configured" }, { status: 500 });
  }

  const envRaw = process.env.DODO_PAYMENTS_ENVIRONMENT ?? "test_mode";
  const environment = envRaw === "live_mode" ? "live_mode" : "test_mode";

  const client = new DodoPayments({
    bearerToken: apiKey,
    environment,
    webhookKey: webhookKey ?? null,
  });

  let event: { type: string; data: unknown };

  try {
    if (webhookKey) {
      event = client.webhooks.unwrap(rawBody, {
        headers: collectStandardWebhookHeaders(request),
      }) as { type: string; data: unknown };
    } else {
      console.warn("DODO_PAYMENTS_WEBHOOK_KEY not set — webhook signature not verified");
      event = client.webhooks.unsafeUnwrap(rawBody) as { type: string; data: unknown };
    }
  } catch {
    return NextResponse.json({ error: "Invalid webhook" }, { status: 401 });
  }

  const sub = getSubscriptionPayload(event);
  if (!sub) {
    return NextResponse.json({ ok: true, ignored: event.type });
  }

  const supabase = createServiceClient();

  let userId = resolveUserIdFromDodoSubscription(sub);
  if (!userId && sub.customer?.email) {
    userId = await findUserIdByEmail(supabase, sub.customer.email);
  }

  if (!userId) {
    console.warn(
      "Dodo webhook: could not resolve user — ensure checkout metadata includes user_id"
    );
    return NextResponse.json({ ok: true, warning: "no user_id" });
  }

  const { error } = await syncProfileFromDodoSubscription(supabase, userId, sub);
  if (error) {
    console.error("Dodo profile sync:", error);
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
