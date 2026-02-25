"use server";

import { getSessionUser } from "@/lib/session";
import {
    getCreditBalance,
    deductCredits,
    getGenerationCost,
    type CreditBalance,
} from "@/lib/credits";

/**
 * Get the current credit balance for the authenticated user's tenant.
 */
export async function getMyCredits(): Promise<CreditBalance> {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
        throw new Error("Nicht angemeldet.");
    }

    return getCreditBalance(sessionUser.tenantId);
}

/**
 * Check if the authenticated user can generate with the given provider.
 * Returns cost info without deducting.
 */
export async function canGenerate(
    provider: string,
): Promise<{ allowed: boolean; cost: number; credits: number }> {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
        return { allowed: false, cost: 0, credits: 0 };
    }

    const balance = await getCreditBalance(sessionUser.tenantId);
    const cost = getGenerationCost(provider);

    return {
        allowed: balance.credits >= cost,
        cost,
        credits: balance.credits,
    };
}

/**
 * Deduct credits for a generation. Called from generate3d.ts after successful submission.
 */
export async function useGenerationCredit(
    provider: string,
): Promise<CreditBalance> {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
        throw new Error("Nicht angemeldet.");
    }

    return deductCredits(sessionUser.tenantId, provider);
}
