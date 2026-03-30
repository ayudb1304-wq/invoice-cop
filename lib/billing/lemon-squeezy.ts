import crypto from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, SubscriptionStatus } from "@/types/database";

type DB = Database;
type ProfileUpdate = DB["public"]["Tables"]["profiles"]["Update"];

/** Lemon Squeezy webhook JSON:API-style payload */
export interface LemonSqueezyWebhookBody {
  meta: {
    event_name: string;
    custom_data?: Record<string, string | number | undefined>;
  };
  data: {
    type: string;
    id: string;
    attributes: {
      status?: string;
      user_email?: string;
      trial_ends_at?: string | null;
      ends_at?: string | null;
      [key: string]: unknown;
    };
  };
}

export function verifyLemonSqueezySignature(
  rawBody: string,
  xSignature: string | null,
  secret: string
): boolean {
  if (!xSignature) return false;
  const hmac = crypto.createHmac("sha256", secret);
  const digest = Buffer.from(hmac.update(rawBody).digest("hex"), "utf8");
  const signature = Buffer.from(xSignature, "utf8");
  if (digest.length !== signature.length) return false;
  return crypto.timingSafeEqual(digest, signature);
}

/** Map Lemon Squeezy subscription.status → profiles.subscription_status */
export function mapLemonSqueezyStatus(lsStatus: string): SubscriptionStatus {
  switch (lsStatus) {
    case "active":
      return "active";
    case "on_trial":
      return "trialing";
    case "past_due":
    case "unpaid":
    case "paused":
      return "past_due";
    case "cancelled":
    case "expired":
      return "cancelled";
    default:
      return "past_due";
  }
}

export function resolveProfileUserId(body: LemonSqueezyWebhookBody): string | null {
  const raw = body.meta?.custom_data?.user_id;
  if (raw !== undefined && raw !== null) return String(raw);
  return null;
}

export async function syncProfileFromLemonSqueezySubscription(
  supabase: SupabaseClient<DB>,
  userId: string,
  subscriptionId: string,
  attrs: LemonSqueezyWebhookBody["data"]["attributes"]
): Promise<{ error: string | null }> {
  const lsStatus = attrs.status ?? "";
  const subscription_status = mapLemonSqueezyStatus(lsStatus);

  const trialFromLs =
    lsStatus === "on_trial" && attrs.trial_ends_at ? attrs.trial_ends_at : null;

  const updates: ProfileUpdate = {
    lemon_squeezy_subscription_id: subscriptionId,
    subscription_status,
    updated_at: new Date().toISOString(),
  };

  if (subscription_status === "trialing") {
    if (trialFromLs) updates.trial_ends_at = trialFromLs;
  } else {
    updates.trial_ends_at = null;
  }

  const { error } = await supabase.from("profiles").update(updates).eq("id", userId);

  return { error: error?.message ?? null };
}

/** Fallback: find profile by email when custom_data.user_id was missing */
export async function findUserIdByEmail(
  supabase: SupabaseClient<DB>,
  email: string
): Promise<string | null> {
  const { data } = await supabase.from("profiles").select("id").eq("email", email).maybeSingle();
  return data?.id ?? null;
}
