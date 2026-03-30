import { createClient } from "@/utils/supabase/server";
import { buildLemonSqueezyCheckoutUrl } from "@/lib/billing/checkout-url";
import Link from "next/link";
import { ExternalLinkIcon } from "lucide-react";

export const metadata = { title: "Settings" };

const STATUS_LABEL: Record<string, string> = {
  trialing: "Trial",
  active: "Active",
  past_due: "Past due",
  cancelled: "Cancelled",
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status, trial_ends_at, lemon_squeezy_subscription_id")
    .eq("id", user.id)
    .single();

  const status = profile?.subscription_status ?? "trialing";
  const checkoutUrl = buildLemonSqueezyCheckoutUrl(user.id);
  const trialEnds = profile?.trial_ends_at
    ? new Date(profile.trial_ends_at).toLocaleDateString(undefined, {
        dateStyle: "medium",
      })
    : null;

  const needsSubscription =
    status === "trialing" || status === "past_due" || status === "cancelled";

  return (
    <div className="mx-auto max-w-lg space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">Billing and your account</p>
      </div>

      <section className="border-muted space-y-4 rounded-xl border p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Subscription
        </h2>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Status</dt>
            <dd className="font-medium">{STATUS_LABEL[status] ?? status}</dd>
          </div>
          {status === "trialing" && trialEnds && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Trial ends</dt>
              <dd className="font-medium">{trialEnds}</dd>
            </div>
          )}
          {profile?.lemon_squeezy_subscription_id && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Lemon Squeezy</dt>
              <dd className="font-mono text-xs">
                …{profile.lemon_squeezy_subscription_id.slice(-8)}
              </dd>
            </div>
          )}
        </dl>

        {checkoutUrl && needsSubscription && (
          <a
            href={checkoutUrl}
            className="bg-foreground text-background mt-4 inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
          >
            Subscribe or manage plan
            <ExternalLinkIcon className="h-3.5 w-3.5" />
          </a>
        )}

        {!checkoutUrl && (
          <p className="text-muted-foreground mt-4 text-sm">
            Set{" "}
            <code className="bg-muted rounded px-1 py-0.5 text-xs">
              NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL
            </code>{" "}
            in your environment to enable checkout (your Lemon Squeezy product checkout link).
          </p>
        )}

        <p className="text-muted-foreground mt-4 text-xs leading-relaxed">
          Payments are processed by Lemon Squeezy. We receive your user ID after checkout via
          webhook so your account can stay in sync.{" "}
          <Link
            href="https://docs.lemonsqueezy.com/help/checkout/passing-custom-data"
            className="text-foreground underline underline-offset-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            Custom checkout data
          </Link>
        </p>
      </section>
    </div>
  );
}
