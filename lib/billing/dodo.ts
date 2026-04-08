import type { SupabaseClient } from "@supabase/supabase-js";
import type { Subscription } from "dodopayments/resources/subscriptions";
import type { Database, SubscriptionStatus } from "@/types/database";

type DB = Database;
type ProfileUpdate = DB["public"]["Tables"]["profiles"]["Update"];

export function mapDodoSubscriptionToProfile(sub: Subscription): {
  subscription_status: SubscriptionStatus;
  trial_ends_at: string | null;
} {
  const { status, trial_period_days, next_billing_date } = sub;

  if (status === "active") {
    return { subscription_status: "active", trial_ends_at: null };
  }

  if (status === "pending") {
    const trialEnds =
      trial_period_days > 0 && next_billing_date ? next_billing_date : null;
    return { subscription_status: "trialing", trial_ends_at: trialEnds };
  }

  if (status === "on_hold" || status === "failed") {
    return { subscription_status: "past_due", trial_ends_at: null };
  }

  if (status === "cancelled" || status === "expired") {
    return { subscription_status: "cancelled", trial_ends_at: null };
  }

  return { subscription_status: "past_due", trial_ends_at: null };
}

export async function syncProfileFromDodoSubscription(
  supabase: SupabaseClient<DB>,
  userId: string,
  sub: Subscription
): Promise<{ error: string | null }> {
  const { subscription_status, trial_ends_at } = mapDodoSubscriptionToProfile(sub);

  const updates: ProfileUpdate = {
    dodo_subscription_id: sub.subscription_id,
    subscription_status,
    updated_at: new Date().toISOString(),
  };

  if (subscription_status === "trialing") {
    if (trial_ends_at) updates.trial_ends_at = trial_ends_at;
  } else {
    updates.trial_ends_at = null;
  }

  const { error } = await supabase.from("profiles").update(updates).eq("id", userId);
  return { error: error?.message ?? null };
}

export function resolveUserIdFromDodoSubscription(sub: Subscription): string | null {
  const fromMeta = sub.metadata?.user_id;
  if (fromMeta) return String(fromMeta);
  return null;
}

export async function findUserIdByEmail(
  supabase: SupabaseClient<DB>,
  email: string
): Promise<string | null> {
  const { data } = await supabase.from("profiles").select("id").eq("email", email).maybeSingle();
  return data?.id ?? null;
}
