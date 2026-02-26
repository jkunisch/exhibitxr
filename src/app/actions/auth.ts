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
  idToken: z.string().min(1, "ID-Token ist erforderlich."),
});

const SessionSchema = z.object({
  idToken: z.string().min(1, "ID-Token ist erforderlich."),
});

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message || "Validierung fehlgeschlagen.";
  }
  return error instanceof Error && error.message ? error.message : fallback;
}

const DEFAULT_TENANT_NAME = "Neuer Tenant";

function normalizeTenantName(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().slice(0, 80);
  return normalized.length > 0 ? normalized : null;
}

function getDomainTenantName(email: string | null): string | null {
  if (!email) {
    return null;
  }

  const parts = email.toLowerCase().split("@");
  if (parts.length !== 2) {
    return null;
  }

  const domain = normalizeTenantName(parts[1]?.replace(/^www\./, ""));
  return domain;
}

function getLocalPartTenantName(email: string | null): string | null {
  if (!email) {
    return null;
  }

  const parts = email.split("@");
  if (parts.length === 0) {
    return null;
  }

  return normalizeTenantName(parts[0]);
}

function deriveTenantName(email: string | null, displayName: string | null): string {
  return (
    getDomainTenantName(email) ??
    normalizeTenantName(displayName) ??
    getLocalPartTenantName(email) ??
    DEFAULT_TENANT_NAME
  );
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
 * Creates a tenant for a Google-authenticated user, adds the user as owner member, sets custom claims,
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
export async function registerTenantFromGoogle(
  idToken: string,
): Promise<RegisterTenantResult> {
  
  // 1. Input Validation
  const validation = RegisterSchema.safeParse({ idToken });
  if (!validation.success) {
    return { ok: false, error: validation.error.issues[0].message, code: "INVALID_INPUT" };
  }

  try {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    const uid = decodedToken.uid;
    const email =
      typeof decodedToken.email === "string" ? decodedToken.email : null;
    const displayName =
      typeof decodedToken.name === "string" ? decodedToken.name : null;
    const existingTenantId =
      typeof decodedToken.tenantId === "string" ? decodedToken.tenantId : null;
    
    // Fail closed: Prevent re-registration if they already belong to a tenant
    if (existingTenantId) {
      return {
        ok: false,
        error: "Dieses Konto ist bereits einem Tenant zugeordnet. Bitte anmelden.",
        code: "USER_ALREADY_HAS_TENANT"
      };
    }

    const tenantId = crypto.randomUUID();
    const role = "owner";
    const tenantName = deriveTenantName(email, displayName);

    // 2. Database Writes (Fail closed if permissions/writes fail)
    await adminDb.collection("tenants").doc(tenantId).set({
      id: tenantId,
      name: tenantName,
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
      error: getErrorMessage(error, "Tenant konnte nicht erstellt werden."),
      code: "INTERNAL_ERROR"
    };
  }
}

// Backward-compatible alias for existing consumers.
export async function registerTenantAndSession(
  idToken: string,
  _legacyCompanyName?: string,
): Promise<RegisterTenantResult> {
  return registerTenantFromGoogle(idToken);
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
        error: "Kein Tenant-Claim gefunden. Bitte Onboarding abschliessen oder Support kontaktieren.",
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
