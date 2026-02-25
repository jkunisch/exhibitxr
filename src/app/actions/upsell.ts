"use server";

import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { getSessionUser } from "@/lib/session";

export type UpsellOrderResult =
  | { ok: true; orderId: string }
  | { ok: false; error: string };

/**
 * Creates a "Make it Perfect" concierge order.
 */
export async function createConciergeOrder(exhibitId: string): Promise<UpsellOrderResult> {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return { ok: false, error: "Nicht authentifiziert." };
  }

  const adminDb = getAdminDb();
  const orderId = crypto.randomUUID();
  const now = FieldValue.serverTimestamp();

  try {
    const batch = adminDb.batch();

    // 1. Create order document
    const orderRef = adminDb
      .collection("tenants")
      .doc(sessionUser.tenantId)
      .collection("orders")
      .doc(orderId);

    batch.set(orderRef, {
      id: orderId,
      type: "make_it_perfect",
      exhibitId,
      status: "pending",
      amount: 49,
      currency: "EUR",
      createdAt: now,
      updatedAt: now,
      userId: sessionUser.uid,
    });

    // 2. Update exhibit status
    const exhibitRef = adminDb
      .collection("tenants")
      .doc(sessionUser.tenantId)
      .collection("exhibitions")
      .doc(exhibitId);

    batch.update(exhibitRef, {
      conciergeStatus: "ordered",
      updatedAt: now,
    });

    await batch.commit();

    revalidatePath(`/dashboard/editor/${exhibitId}`);
    return { ok: true, orderId };
  } catch (error) {
    console.error("Error creating concierge order:", error);
    return { ok: false, error: "Bestellung fehlgeschlagen. Bitte versuche es später erneut." };
  }
}

/**
 * Checks if an exhibit has an active concierge order.
 */
export async function getConciergeStatus(exhibitId: string, tenantId: string) {
  const adminDb = getAdminDb();
  
  try {
    const doc = await adminDb
      .collection("tenants")
      .doc(tenantId)
      .collection("exhibitions")
      .doc(exhibitId)
      .get();
    
    return doc.data()?.conciergeStatus || "none";
  } catch (error) {
    console.error("Error fetching concierge status:", error);
    return "none";
  }
}
