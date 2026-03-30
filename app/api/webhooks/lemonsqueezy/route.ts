import { NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/server";
import {
  type LemonSqueezyWebhookBody,
  verifyLemonSqueezySignature,
  resolveProfileUserId,
  syncProfileFromLemonSqueezySubscription,
  findUserIdByEmail,
} from "@/lib/billing/lemon-squeezy";

const SUBSCRIPTION_EVENTS = new Set([
  "subscription_created",
  "subscription_updated",
  "subscription_cancelled",
  "subscription_expired",
  "subscription_resumed",
  "subscription_paused",
  "subscription_unpaused",
]);

export async function POST(request: Request) {
  const rawBody = await request.text();
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

  if (secret) {
    const sig = request.headers.get("x-signature");
    if (!verifyLemonSqueezySignature(rawBody, sig, secret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  } else {
    console.warn(
      "LEMONSQUEEZY_WEBHOOK_SECRET is not set; webhook signatures are not verified"
    );
  }

  let body: LemonSqueezyWebhookBody;
  try {
    body = JSON.parse(rawBody) as LemonSqueezyWebhookBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventName = body.meta?.event_name;
  if (!eventName || !SUBSCRIPTION_EVENTS.has(eventName)) {
    return NextResponse.json({ ok: true, ignored: eventName });
  }

  if (body.data?.type !== "subscriptions") {
    return NextResponse.json({ ok: true, ignored: "not a subscription resource" });
  }

  const subscriptionId = body.data.id;
  const attrs = body.data.attributes;
  if (!attrs) {
    return NextResponse.json({ ok: true });
  }

  let userId = resolveProfileUserId(body);
  const supabase = createServiceClient();

  if (!userId && attrs.user_email) {
    userId = await findUserIdByEmail(supabase, attrs.user_email);
  }

  if (!userId) {
    console.warn(
      "Lemon Squeezy webhook: could not resolve user (add checkout[custom][user_id] to checkout URL)"
    );
    return NextResponse.json({ ok: true, warning: "no user_id" });
  }

  const { error } = await syncProfileFromLemonSqueezySubscription(
    supabase,
    userId,
    subscriptionId,
    attrs
  );

  if (error) {
    console.error("Lemon Squeezy profile sync:", error);
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
