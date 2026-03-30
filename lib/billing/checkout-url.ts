/**
 * Build Lemon Squeezy checkout URL with `user_id` in custom data for webhook linking.
 * Set NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL to your product’s full checkout link from the dashboard
 * (e.g. https://your-store.lemonsqueezy.com/checkout/buy/xxxx).
 */
export function buildLemonSqueezyCheckoutUrl(userId: string): string | null {
  const base = process.env.NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL;
  if (!base) return null;
  try {
    const u = new URL(base);
    u.searchParams.append("checkout[custom][user_id]", userId);
    return u.toString();
  } catch {
    return null;
  }
}
