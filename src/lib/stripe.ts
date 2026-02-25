import Stripe from "stripe";

let cachedStripe: Stripe | null = null;

function getStripeSecretKey(): string {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey || secretKey.trim().length === 0) {
    throw new Error("Missing STRIPE_SECRET_KEY environment variable.");
  }

  return secretKey;
}

export function getStripe(): Stripe {
  if (cachedStripe) {
    return cachedStripe;
  }

  cachedStripe = new Stripe(getStripeSecretKey());
  return cachedStripe;
}
