"use server";

import { cookies } from "next/headers";
import { z } from "zod";

import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";

const SESSION_COOKIE_NAME = "session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 5; // 5 days

// Enhanced Return Types with distinct codes for better UI handling
export type SessionActionResult = 
  | { ok: true } 
  | { ok: false; error: string; code?: string };

export type RegisterTenantResult =
  | { ok: true; tenantId: string }
  | { ok: false; error: string; code?: string };

// Validation Schemas
const RegisterSchema = z.object({
  idToken: z.string().min(1, "ID token is required."),
  companyName: z.string().trim().min(2, "Company name must be at least 2 characters."),
});

const SessionSchema = z.object({
  idToken: z.string().min(1, "ID token is required."),
});

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message || "Validation failed";
  }
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
      code: "COOKIE_CREATION_FAILED"
    };
  }
}

/**
 * Creates a tenant, adds the current user as owner member, sets custom claims,
 * but does NOT create the final session cookie yet.
 *
 * IMPORTANT HANDOFF DOCUMENTATION:
 * 1. Client calls this action with an `idToken`.
 * 2. Server creates Tenant, Member, and sets Custom Claims (tenantId, role).
 * 3. Client MUST call `await firebase.auth().currentUser?.getIdToken(true)` 
 *    after a successful response to refresh local claims.
 * 4. Finally, Client MUST call `createSessionCookieAction(refreshedToken)` 
 *    to finalize the SSR login.
 */
export async function registerTenantAndSession(
  idToken: string,
  companyName: string,
): Promise<RegisterTenantResult> {
  
  // 1. Input Validation
  const validation = RegisterSchema.safeParse({ idToken, companyName });
  if (!validation.success) {
    return { ok: false, error: validation.error.issues[0].message, code: "INVALID_INPUT" };
  }

  try {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    const uid = decodedToken.uid;
    const email = decodedToken.email ?? null;
    const existingTenantId =
      typeof decodedToken.tenantId === "string" ? decodedToken.tenantId : null;
    
    // Fail closed: Prevent re-registration if they already belong to a tenant
    if (existingTenantId) {
      return {
        ok: false,
        error: "User already has a tenant claim. Use login instead.",
        code: "USER_ALREADY_HAS_TENANT"
      };
    }

    const tenantId = crypto.randomUUID();
    const role = "owner";

    // 2. Database Writes (Fail closed if permissions/writes fail)
    await adminDb.collection("tenants").doc(tenantId).set({
      id: tenantId,
      name: validation.data.companyName,
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

    // 3. Claim-Set
    await adminAuth.setCustomUserClaims(uid, { tenantId, role });

    return { ok: true, tenantId };
  } catch (error) {
    return {
      ok: false,
      error: getErrorMessage(error, "Failed to register tenant and session."),
      code: "INTERNAL_ERROR"
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
  const validation = SessionSchema.safeParse({ idToken });
  if (!validation.success) {
    return { ok: false, error: validation.error.issues[0].message, code: "INVALID_INPUT" };
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
        error: "User has no tenant claim. Complete onboarding or contact support.",
        code: "TENANT_CLAIM_MISSING", // Explicit error code for UI
      };
    }

    return setSessionCookie(idToken);
  } catch (error) {
    return {
      ok: false,
      error: getErrorMessage(error, "Could not create session cookie."),
      code: "INTERNAL_ERROR"
    };
  }
}

// Backward-compatible alias for existing consumers.
export async function createSession(idToken: string): Promise<{
  success: boolean;
  error?: string;
  code?: string;
}> {
  const result = await createSessionCookieAction(idToken);
  return result.ok 
    ? { success: true } 
    : { success: false, error: result.error, code: result.code };
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
