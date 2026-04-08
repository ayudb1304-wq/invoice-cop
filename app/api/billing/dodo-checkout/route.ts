import { NextResponse } from "next/server";
import DodoPayments from "dodopayments";
import { getDodoCheckoutConfig } from "@/lib/billing/dodo-config";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const cfg = getDodoCheckoutConfig();
  if (!cfg) {
    return NextResponse.json(
      {
        error:
          "Missing DODO_PAYMENTS_API_KEY, DODO_PAYMENTS_SUBSCRIPTION_PRODUCT_ID, or NEXT_PUBLIC_APP_URL",
      },
      { status: 500 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = new DodoPayments({
    bearerToken: cfg.apiKey,
    environment: cfg.environment,
  });

  const session = await client.checkoutSessions.create({
    product_cart: [{ product_id: cfg.productId, quantity: 1 }],
    customer: { email: user.email },
    metadata: { user_id: user.id },
    return_url: `${cfg.appUrl}/settings?billing=success`,
    cancel_url: `${cfg.appUrl}/settings?billing=cancelled`,
    ...(cfg.trialDays > 0 ? { subscription_data: { trial_period_days: cfg.trialDays } } : {}),
  });

  const url = session.checkout_url;
  if (!url) {
    return NextResponse.json({ error: "Dodo did not return a checkout URL" }, { status: 502 });
  }

  return NextResponse.redirect(url);
}
