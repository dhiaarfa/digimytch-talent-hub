import Stripe from "stripe";

let cached: Stripe | null = null;

/** Lazy Stripe client so `next build` does not require STRIPE_SECRET_KEY at module evaluation. */
export function getStripeServer(): Stripe {
  if (!cached) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error(
        "STRIPE_SECRET_KEY is not configured. Stripe features are disabled."
      );
    }
    cached = new Stripe(key, { apiVersion: "2025-04-30.basil" });
  }
  return cached;
}
