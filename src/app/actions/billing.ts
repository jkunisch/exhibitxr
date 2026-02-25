"use server";

import { z } from "zod";

import { getSessionUser } from "@/lib/session";
import { getStripe } from "@/lib/stripe";

const checkoutPlanSchema = z.enum(["starter", "pro"]);

type CheckoutPlanId = z.infer<typeof checkoutPlanSchema>;

const PRICE_ENV_BY_PLAN: Record<CheckoutPlanId, string> = {
  starter: "STRIPE_PRICE_STARTER",
  pro: "STRIPE_PRICE_PRO",
};

function getAppBaseUrl(): string {
  const envBaseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL;
  const fallback = "http://localhost:3000";
  const value = envBaseUrl && envBaseUrl.trim().length > 0 ? envBaseUrl : fallback;

  try {
    return new URL(value).origin;
  } catch {
    throw new Error("Invalid NEXT_PUBLIC_APP_URL/APP_URL environment variable.");
  }
}

function getPriceId(planId: CheckoutPlanId): string {
  const envKey = PRICE_ENV_BY_PLAN[planId];
  const priceId = process.env[envKey];

  if (!priceId || priceId.trim().length === 0) {
    throw new Error(`Missing ${envKey} environment variable.`);
  }

  return priceId;
}

export async function createCheckoutSession(
  planId: "starter" | "pro",
): Promise<{ url: string }> {
  const validatedPlanId = checkoutPlanSchema.parse(planId);
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    throw new Error("Not authenticated.");
  }

  if (!sessionUser.email) {
    throw new Error("User email is required to start Stripe checkout.");
  }

  const stripe = getStripe();
  const appBaseUrl = getAppBaseUrl();
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: sessionUser.email,
    line_items: [{ price: getPriceId(validatedPlanId), quantity: 1 }],
    metadata: {
      tenantId: sessionUser.tenantId,
      uid: sessionUser.uid,
      planId: validatedPlanId,
    },
    subscription_data: {
      metadata: {
        tenantId: sessionUser.tenantId,
        uid: sessionUser.uid,
        planId: validatedPlanId,
      },
    },
    success_url: `${appBaseUrl}/dashboard?upgraded=true`,
    cancel_url: `${appBaseUrl}/dashboard/billing`,
  });

  if (!checkoutSession.url) {
    throw new Error("Stripe checkout did not return a redirect URL.");
  }

  return { url: checkoutSession.url };
}
