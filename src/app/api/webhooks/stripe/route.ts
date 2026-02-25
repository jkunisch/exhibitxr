import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";

import { getAdminDb } from "@/lib/firebaseAdmin";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

const checkoutPlanSchema = z.enum(["starter", "pro"]);

type CheckoutPlanId = z.infer<typeof checkoutPlanSchema>;

function getWebhookSecret(): string {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret || webhookSecret.trim().length === 0) {
    throw new Error("Missing STRIPE_WEBHOOK_SECRET environment variable.");
  }

  return webhookSecret;
}

function getMetadataValue(
  metadata: Stripe.Metadata | null | undefined,
  key: string,
): string | null {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

async function updateTenantPlanToPaid(
  tenantId: string,
  planId: CheckoutPlanId,
  session: Stripe.Checkout.Session,
): Promise<void> {
  const adminDb = getAdminDb();
  const updatePayload: Record<string, unknown> = {
    plan: planId,
    updatedAt: new Date().toISOString(),
  };

  if (typeof session.customer === "string") {
    updatePayload.stripeCustomerId = session.customer;
  }

  if (typeof session.subscription === "string") {
    updatePayload.stripeSubscriptionId = session.subscription;
  }

  await adminDb.collection("tenants").doc(tenantId).set(updatePayload, { merge: true });
}

async function updateTenantPlanToFree(
  tenantId: string,
  subscriptionId: string | null,
): Promise<void> {
  const adminDb = getAdminDb();
  const updatePayload: Record<string, unknown> = {
    plan: "free",
    updatedAt: new Date().toISOString(),
  };

  if (subscriptionId) {
    updatePayload.stripeSubscriptionId = FieldValue.delete();
  }

  await adminDb.collection("tenants").doc(tenantId).set(updatePayload, { merge: true });
}

async function resolveTenantIdForSubscription(
  subscription: Stripe.Subscription,
): Promise<string | null> {
  const tenantIdFromMetadata = getMetadataValue(subscription.metadata, "tenantId");
  if (tenantIdFromMetadata) {
    return tenantIdFromMetadata;
  }

  const adminDb = getAdminDb();
  const bySubscription = await adminDb
    .collection("tenants")
    .where("stripeSubscriptionId", "==", subscription.id)
    .limit(1)
    .get();

  if (bySubscription.empty) {
    return null;
  }

  return bySubscription.docs[0]?.id ?? null;
}

async function handleCheckoutCompleted(event: Stripe.Event): Promise<void> {
  const session = event.data.object as Stripe.Checkout.Session;
  const tenantId = getMetadataValue(session.metadata, "tenantId");
  const planIdRaw = getMetadataValue(session.metadata, "planId");

  if (!tenantId || !planIdRaw) {
    console.error("[stripe-webhook] Missing tenantId/planId metadata on checkout session.", {
      eventId: event.id,
      tenantId,
      planIdRaw,
    });
    return;
  }

  const planResult = checkoutPlanSchema.safeParse(planIdRaw);
  if (!planResult.success) {
    console.error("[stripe-webhook] Invalid planId metadata on checkout session.", {
      eventId: event.id,
      planIdRaw,
    });
    return;
  }

  await updateTenantPlanToPaid(tenantId, planResult.data, session);
}

async function handleSubscriptionDeleted(event: Stripe.Event): Promise<void> {
  const subscription = event.data.object as Stripe.Subscription;
  const tenantId = await resolveTenantIdForSubscription(subscription);

  if (!tenantId) {
    console.error("[stripe-webhook] Could not resolve tenant for subscription cancellation.", {
      eventId: event.id,
      subscriptionId: subscription.id,
    });
    return;
  }

  await updateTenantPlanToFree(tenantId, subscription.id);
}

export async function POST(request: Request): Promise<Response> {
  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    console.error("[stripe-webhook] Missing Stripe signature header.");
    return NextResponse.json({ received: true });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, getWebhookSecret());
  } catch (error) {
    console.error("[stripe-webhook] Signature verification failed.", error);
    return NextResponse.json({ received: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event);
        break;
      default:
        break;
    }
  } catch (error) {
    console.error("[stripe-webhook] Handler failed.", { eventType: event.type, error });
  }

  return NextResponse.json({ received: true });
}
