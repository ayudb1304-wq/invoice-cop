import { createClient } from "@/utils/supabase/server";
import { getDodoCheckoutConfig } from "@/lib/billing/dodo-config";
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
    .select("subscription_status, trial_ends_at, dodo_subscription_id")
    .eq("id", user.id)
    .single();

  const status = profile?.subscription_status ?? "trialing";
  const dodoConfigured = getDodoCheckoutConfig() !== null;
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
          {profile?.dodo_subscription_id && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Dodo</dt>
              <dd className="font-mono text-xs">
                …{profile.dodo_subscription_id.slice(-8)}
              </dd>
            </div>
          )}
        </dl>

        {dodoConfigured && needsSubscription && (
          <a
            href="/api/billing/dodo-checkout"
            className="bg-foreground text-background mt-4 inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
          >
            Subscribe or manage plan
            <ExternalLinkIcon className="h-3.5 w-3.5" />
          </a>
        )}

        {!dodoConfigured && (
          <p className="text-muted-foreground mt-4 text-sm">
            Set{" "}
            <code className="bg-muted rounded px-1 py-0.5 text-xs">
              DODO_PAYMENTS_API_KEY
            </code>
            ,{" "}
            <code className="bg-muted rounded px-1 py-0.5 text-xs">
              DODO_PAYMENTS_SUBSCRIPTION_PRODUCT_ID
            </code>
            , and{" "}
            <code className="bg-muted rounded px-1 py-0.5 text-xs">
              NEXT_PUBLIC_APP_URL
            </code>{" "}
            to enable checkout.
          </p>
        )}

        <p className="text-muted-foreground mt-4 text-xs leading-relaxed">
          Payments are processed by{" "}
          <Link
            href="https://dodopayments.com"
            className="text-foreground underline underline-offset-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            Dodo Payments
          </Link>
          . We attach your user id to the checkout session metadata so webhooks can update your
          account. See the{" "}
          <Link
            href="https://docs.dodopayments.com/api-reference/subscription-integration-guide"
            className="text-foreground underline underline-offset-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            subscription integration guide
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
