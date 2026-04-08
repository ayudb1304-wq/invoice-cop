/** Shared env check for Dodo checkout (server-side). */

export type DodoCheckoutConfig = {
  apiKey: string;
  environment: "test_mode" | "live_mode";
  productId: string;
  appUrl: string;
  trialDays: number;
};

export function getDodoCheckoutConfig(): DodoCheckoutConfig | null {
  const apiKey = process.env.DODO_PAYMENTS_API_KEY;
  const productId = process.env.DODO_PAYMENTS_SUBSCRIPTION_PRODUCT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!apiKey || !productId || !appUrl) return null;
  const envRaw = process.env.DODO_PAYMENTS_ENVIRONMENT ?? "test_mode";
  const environment = envRaw === "live_mode" ? "live_mode" : "test_mode";
  const trialDays = Math.min(
    10000,
    Math.max(0, parseInt(process.env.DODO_TRIAL_PERIOD_DAYS ?? "14", 10) || 0)
  );
  return {
    apiKey,
    environment,
    productId,
    appUrl: appUrl.replace(/\/$/, ""),
    trialDays,
  };
}
