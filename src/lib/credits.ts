/**
 * Credits system for 3D model generation.
 *
 * Each tenant has `generationCredits` (remaining) and `totalGenerationsUsed` (lifetime).
 * Credits are granted by plan upgrades, one-time purchases, or admin actions.
 * Credits are consumed when a 3D model generation is submitted.
 */

import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { isAdminEmail as isConfiguredAdminEmail } from "@/lib/adminEmails";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { normalizePlan, type PlanTier } from "@/lib/planLimits";

// ─── Admin Bypass ───────────────────────────────────────────────────────────
export function isAdminEmail(email: string | undefined | null): boolean {
    return isConfiguredAdminEmail(email);
}

// ─── Plan Credit Grants ─────────────────────────────────────────────────────

/** Credits granted when a tenant upgrades to a plan (monthly). */
const PLAN_MONTHLY_CREDITS: Record<PlanTier, number> = {
    free: 10,      // 10 free credits to try the product (~3 premium or 10 basic)
    starter: 30,   // 30 credits/month included (Creator plan)
    pro: 80,       // 80 credits/month included (Studio plan)
    enterprise: 500, // 500 credits/month included (Business plan)
};

/** Credit cost per generation by provider. */
const GENERATION_COST: Record<string, number> = {
    basic: 1,    // Tripo — fast, ~30s
    premium: 3,  // Meshy — high quality, 3-5 min
    upscale: 1,  // Texture upscaling to 4K
};

// ─── Rate Limiting (anonymous) ──────────────────────────────────────────────

const ANONYMOUS_RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
const ANONYMOUS_MAX_GENERATIONS = 1; // 1 per IP per 24h

// ─── Helpers ────────────────────────────────────────────────────────────────

function asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== "object") return null;
    return value as Record<string, unknown>;
}

// ─── Public API ─────────────────────────────────────────────────────────────

export interface CreditBalance {
    credits: number;
    totalUsed: number;
    plan: PlanTier;
}

/**
 * Get the credit balance for a tenant.
 */
export async function getCreditBalance(tenantId: string): Promise<CreditBalance> {
    const doc = await getAdminDb().collection("tenants").doc(tenantId).get();
    const data = asRecord(doc.data());

    const plan = normalizePlan(data?.plan);

    // Enterprise = unlimited
    if (plan === "enterprise") {
        return { credits: 999999, totalUsed: 0, plan };
    }

    // If generationCredits field doesn't exist yet (existing tenants),
    // grant plan-appropriate defaults so users aren't blocked.
    const credits = typeof data?.generationCredits === "number"
        ? Math.max(0, data.generationCredits)
        : PLAN_MONTHLY_CREDITS[plan];
    const totalUsed = typeof data?.totalGenerationsUsed === "number"
        ? Math.max(0, data.totalGenerationsUsed)
        : 0;

    return { credits, totalUsed, plan };
}

/**
 * Check if a tenant can generate a model with the given provider.
 * Returns the cost if allowed, throws if not.
 */
export function getGenerationCost(provider: string): number {
    return GENERATION_COST[provider] ?? 1;
}

/**
 * Deduct credits for a generation. Returns the new balance.
 * Throws if insufficient credits.
 */
export async function deductCredits(
    tenantId: string,
    provider: string,
): Promise<CreditBalance> {
    const cost = getGenerationCost(provider);
    const balance = await getCreditBalance(tenantId);

    if (balance.credits < cost) {
        throw new Error(
            `Nicht genügend Credits. Benötigt: ${cost}, Verfügbar: ${balance.credits}. ` +
            `Bitte upgraden oder Credits zukaufen.`
        );
    }

    await getAdminDb().collection("tenants").doc(tenantId).update({
        generationCredits: FieldValue.increment(-cost),
        totalGenerationsUsed: FieldValue.increment(1),
    });

    return {
        credits: balance.credits - cost,
        totalUsed: balance.totalUsed + 1,
        plan: balance.plan,
    };
}

/**
 * Refund credits after a failed generation.
 * Logged for audit trail to prevent abuse.
 */
export async function refundCredits(
    tenantId: string,
    provider: string,
    reason: string,
): Promise<void> {
    const cost = getGenerationCost(provider);

    await getAdminDb().collection("tenants").doc(tenantId).update({
        generationCredits: FieldValue.increment(cost),
        totalGenerationsUsed: FieldValue.increment(-1),
    });

    // Audit log
    await getAdminDb()
        .collection("tenants")
        .doc(tenantId)
        .collection("credit_log")
        .add({
            amount: cost,
            reason: `REFUND: ${reason}`,
            provider,
            createdAt: new Date().toISOString(),
        });

    console.log(`[credits] Refunded ${cost} credit(s) to tenant ${tenantId}: ${reason}`);
}

/**
 * Grant credits to a tenant (plan upgrade, purchase, or admin).
 */
export async function grantCredits(
    tenantId: string,
    amount: number,
    reason: string,
): Promise<void> {
    if (amount <= 0) return;

    const adminDb = getAdminDb();
    await adminDb.collection("tenants").doc(tenantId).update({
        generationCredits: FieldValue.increment(amount),
    });

    // Log the grant for audit trail
    await adminDb
        .collection("tenants")
        .doc(tenantId)
        .collection("credit_log")
        .add({
            amount,
            reason,
            createdAt: new Date().toISOString(),
        });
}

/**
 * Grant monthly credits based on plan tier with a ROLLOVER mechanic.
 * Called from the Stripe webhook on subscription renewal.
 * 
 * Rollover Rule: Credits carry over to the next month, but the total balance 
 * cannot exceed 2x the monthly plan limit to prevent infinite hoarding.
 */
export async function grantMonthlyCredits(
    tenantId: string,
    plan: PlanTier,
): Promise<void> {
    const monthlyAmount = PLAN_MONTHLY_CREDITS[plan];
    const maxAllowedBalance = monthlyAmount * 2; // Cap at 2x monthly limit

    const adminDb = getAdminDb();
    
    // We run a transaction to ensure we don't blindly add credits
    await adminDb.runTransaction(async (transaction) => {
        const tenantRef = adminDb.collection("tenants").doc(tenantId);
        const tenantDoc = await transaction.get(tenantRef);
        
        if (!tenantDoc.exists) return;
        
        const currentCredits = typeof tenantDoc.data()?.generationCredits === "number" 
            ? tenantDoc.data()?.generationCredits 
            : 0;
            
        // Calculate how much we can actually add without breaching the cap
        let creditsToAdd = monthlyAmount;
        if (currentCredits + monthlyAmount > maxAllowedBalance) {
            creditsToAdd = Math.max(0, maxAllowedBalance - currentCredits);
        }

        if (creditsToAdd > 0) {
            transaction.update(tenantRef, {
                generationCredits: FieldValue.increment(creditsToAdd)
            });

            // Log the grant for audit trail
            const logRef = tenantRef.collection("credit_log").doc();
            transaction.set(logRef, {
                amount: creditsToAdd,
                reason: `Monthly renewal for ${plan} (Rollover Cap applied)`,
                createdAt: new Date().toISOString(),
            });
        }
    });
}

// ─── Anonymous Rate Limiting ────────────────────────────────────────────────

/**
 * Check if an anonymous IP can generate a model.
 * Uses a Firestore collection to track anonymous generations.
 */
export async function checkAnonymousRateLimit(ipAddress: string): Promise<boolean> {
    const adminDb = getAdminDb();
    const windowStart = new Date(Date.now() - ANONYMOUS_RATE_LIMIT_WINDOW_MS).toISOString();
    const safeIp = ipAddress.replace(/[^a-zA-Z0-9.:]/g, "_");

    const recentGenerations = await adminDb
        .collection("anonymous_generations")
        .where("ip", "==", safeIp)
        .where("createdAt", ">=", windowStart)
        .limit(ANONYMOUS_MAX_GENERATIONS + 1)
        .get();

    return recentGenerations.size < ANONYMOUS_MAX_GENERATIONS;
}

/**
 * Record an anonymous generation for rate limiting.
 */
export async function recordAnonymousGeneration(ipAddress: string): Promise<void> {
    const safeIp = ipAddress.replace(/[^a-zA-Z0-9.:]/g, "_");

    await getAdminDb().collection("anonymous_generations").add({
        ip: safeIp,
        createdAt: new Date().toISOString(),
    });
}
