"use server";

import { cookies } from "next/headers";

import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";

const SESSION_COOKIE_NAME = "session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 5; // 5 days

export type SessionActionResult = { ok: true } | { ok: false; error: string };
export type RegisterTenantResult =
  | { ok: true; tenantId: string }
  | { ok: false; error: string };

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

async function setSessionCookie(idToken: string): Promise<SessionActionResult> {
  try {
    const adminAuth = getAdminAuth();
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_MAX_AGE_SECONDS * 1000,
    });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: "/",
    });

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: getErrorMessage(error, "Could not create session cookie."),
    };
  }
}

/**
 * Creates a tenant, adds the current user as owner member, sets custom claims,
 * and creates a session cookie.
 *
 * IMPORTANT: Client must call `await user.getIdToken(true)` after success.
 */
export async function registerTenantAndSession(
  idToken: string,
  companyName: string,
): Promise<RegisterTenantResult> {
  if (!idToken) {
    return { ok: false, error: "Missing ID token." };
  }

  if (!companyName || companyName.trim().length < 2) {
    return { ok: false, error: "Company name is required." };
  }

  try {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    const uid = decodedToken.uid;
    const email = decodedToken.email ?? null;
    const tenantId = crypto.randomUUID();
    const role = "owner";

    await adminDb.collection("tenants").doc(tenantId).set({
      id: tenantId,
      name: companyName.trim(),
      plan: "free",
      createdAt: new Date().toISOString(),
    });

    await adminDb
      .collection("tenants")
      .doc(tenantId)
      .collection("members")
      .doc(uid)
      .set({
        uid,
        email,
        tenantId,
        role,
        createdAt: new Date().toISOString(),
      });

    await adminAuth.setCustomUserClaims(uid, { tenantId, role });

    const sessionResult = await setSessionCookie(idToken);
    if (!sessionResult.ok) {
      return sessionResult;
    }

    return { ok: true, tenantId };
  } catch (error) {
    return {
      ok: false,
      error: getErrorMessage(error, "Failed to register tenant and session."),
    };
  }
}

/**
 * Creates a session cookie for an already provisioned user.
 * Requires an existing `tenantId` claim.
 */
export async function createSessionCookieAction(
  idToken: string,
): Promise<SessionActionResult> {
  if (!idToken) {
    return { ok: false, error: "Missing ID token." };
  }

  try {
    const adminAuth = getAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const tenantId =
      typeof decodedToken.tenantId === "string" && decodedToken.tenantId.length > 0
        ? decodedToken.tenantId
        : null;

    if (!tenantId) {
      return {
        ok: false,
        error:
          "User has no tenant claim. Complete onboarding or contact support.",
      };
    }

    return setSessionCookie(idToken);
  } catch (error) {
    return {
      ok: false,
      error: getErrorMessage(error, "Could not create session cookie."),
    };
  }
}

// Backward-compatible alias for existing consumers.
export async function createSession(idToken: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const result = await createSessionCookieAction(idToken);
  return result.ok ? { success: true } : { success: false, error: result.error };
}

export async function clearSessionCookieAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

// Backward-compatible alias for existing consumers.
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  try {
    await clearSessionCookieAction();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error, "Failed to sign out."),
    };
  }
}
