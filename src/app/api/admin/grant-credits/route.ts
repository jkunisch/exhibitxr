import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { getSessionUser } from "@/lib/session";
import { isAdminEmail } from "@/lib/credits";
import { FieldValue } from "firebase-admin/firestore";

/**
 * POST /api/admin/grant-credits
 * Body: { amount: number }
 *
 * Admin-only endpoint to grant generation credits to the current tenant.
 */
export async function POST(request: Request): Promise<Response> {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!isAdminEmail(sessionUser.email)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const amount = typeof body.amount === "number" && body.amount > 0 ? body.amount : 0;

    if (amount === 0) {
        return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const tenantId = sessionUser.tenantId;
    const adminDb = getAdminDb();

    await adminDb.collection("tenants").doc(tenantId).update({
        generationCredits: FieldValue.increment(amount),
    });

    // Audit log
    await adminDb
        .collection("tenants")
        .doc(tenantId)
        .collection("credit_log")
        .add({
            amount,
            reason: `Admin grant via API (${sessionUser.email})`,
            createdAt: new Date().toISOString(),
        });

    // Read back updated balance
    const doc = await adminDb.collection("tenants").doc(tenantId).get();
    const data = doc.data();
    const newBalance = typeof data?.generationCredits === "number" ? data.generationCredits : amount;

    return NextResponse.json({
        ok: true,
        granted: amount,
        newBalance,
        tenantId,
    });
}
