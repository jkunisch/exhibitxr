"use server";

import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";

/**
 * Creates a new tenant, sets custom claims, and establishes a session cookie.
 * 
 * IMPORTANT FOR CLIENT INTEGRATION:
 * After this action returns successfully, the client MUST force a token refresh:
 * `await firebase.auth().currentUser?.getIdToken(true)`
 * before attempting any Firestore accesses, otherwise the new claims won't be applied
 * locally, leading to permission denied errors.
 */
export async function registerTenantAndSession(idToken: string, companyName: string) {
    try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        // Generate a new tenant ID (UUID)
        const tenantId = crypto.randomUUID();
        const role = "owner";

        // Save Tenant and User in Firestore
        await adminDb.collection("tenants").doc(tenantId).set({
            id: tenantId,
            name: companyName,
            plan: "free",
        });

        await adminDb.collection("tenants").doc(tenantId).collection("members").doc(uid).set({
            uid: uid,
            email: decodedToken.email,
            tenantId: tenantId,
            role: role,
        });

        // Set Custom Claims for Multi-Tenancy
        await adminAuth.setCustomUserClaims(uid, { tenantId, role });

        // Create a Session Cookie
        const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
        const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
        
        const cookieStore = await cookies();
        cookieStore.set("session", sessionCookie, {
            maxAge: expiresIn / 1000,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
        });

        return { success: true, tenantId };
    } catch (error) {
        console.error("Error in registerTenantAndSession:", error);
        return { success: false, error: "Failed to register tenant and session" };
    }
}

/**
 * Validates the ID token and creates a session cookie for an existing user.
 * Expects the user to already have a tenantId claim.
 */
export async function createSession(idToken: string) {
    try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        
        // Optionally verify user actually has a tenant ID claim (already registered)
        if (!decodedToken.tenantId) {
            return { success: false, error: "User is not associated with a tenant" };
        }

        const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
        const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
        
        const cookieStore = await cookies();
        cookieStore.set("session", sessionCookie, {
            maxAge: expiresIn / 1000,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
        });

        return { success: true };
    } catch (error) {
        console.error("Error in createSession:", error);
        return { success: false, error: "Failed to create session" };
    }
}

/**
 * Deletes the session cookie to sign the user out.
 */
export async function signOut() {
    try {
        const cookieStore = await cookies();
        cookieStore.delete("session");
        return { success: true };
    } catch (error) {
        console.error("Error in signOut:", error);
        return { success: false, error: "Failed to sign out" };
    }
}
