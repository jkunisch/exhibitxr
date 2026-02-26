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

export type RegisterStudioResult =
  | { ok: true; studioId: string }
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

const DEFAULT_STUDIO_NAME = "Neues Studio";

function normalizeStudioName(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().slice(0, 80);
  return normalized.length > 0 ? normalized : null;
}

function getDomainStudioName(email: string | null): string | null {
  if (!email) {
    return null;
  }

  const parts = email.toLowerCase().split("@");
  if (parts.length !== 2) {
    return null;
  }

  const domain = normalizeStudioName(parts[1]?.replace(/^www\./, ""));
  return domain;
}

function getLocalPartStudioName(email: string | null): string | null {
  if (!email) {
    return null;
  }

  const parts = email.split("@");
  if (parts.length === 0) {
    return null;
  }

  return normalizeStudioName(parts[0]);
}

function deriveStudioName(email: string | null, displayName: string | null): string {
  return (
    getDomainStudioName(email) ??
    normalizeStudioName(displayName) ??
    getLocalPartStudioName(email) ??
    DEFAULT_STUDIO_NAME
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
 * Creates a studio for a Google-authenticated user, adds the user as owner member, sets custom claims,
 * but does NOT create the final session cookie yet.
 */
export async function registerStudioFromGoogle(
  idToken: string,
): Promise<RegisterStudioResult> {
  
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
    
    // Use studioId if it exists in claims (transitioning from tenantId)
    const existingStudioId = (decodedToken.studioId || decodedToken.tenantId) as string | undefined;

    // If they already have a studio, just return success so the client can proceed to login
    if (existingStudioId) {
      return { ok: true, studioId: existingStudioId };
    }

    const studioId = crypto.randomUUID();
    const role = "owner";
    const studioName = deriveStudioName(email, displayName);

    // 2. Database Writes
    await adminDb.collection("tenants").doc(studioId).set({
      id: studioId,
      name: studioName,
      plan: "free",
      createdAt: new Date().toISOString(),
    });

    await adminDb
      .collection("tenants")
      .doc(studioId)
      .collection("members")
      .doc(uid)
      .set({
        uid,
        email,
        tenantId: studioId,
        role,
        createdAt: new Date().toISOString(),
      });

    // 3. Claim-Set (we set both for backward compatibility)
    await adminAuth.setCustomUserClaims(uid, { studioId, tenantId: studioId, role });

    return { ok: true, studioId };
  } catch (error) {
    return {
      ok: false,
      error: getErrorMessage(error, "Studio konnte nicht erstellt werden."),
      code: "INTERNAL_ERROR"
    };
  }
}

// Backward-compatible alias
export const registerTenantFromGoogle = registerStudioFromGoogle as any;
export const registerTenantAndSession = registerStudioFromGoogle as any;

/**
 * Creates a session cookie for an already provisioned user.
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
    
    const studioId = (decodedToken.studioId || decodedToken.tenantId) as string | undefined;

    if (!studioId) {
      return {
        ok: false,
        error: "Kein Studio-Profil gefunden. Bitte zuerst registrieren.",
        code: "STUDIO_CLAIM_MISSING",
      };
    }

    return setSessionCookie(idToken);
  } catch (error) {
    return {
      ok: false,
      error: getErrorMessage(error, "Session konnte nicht erstellt werden."),
      code: "INTERNAL_ERROR"
    };
  }
}

// Backward-compatible aliases
export const createSession = createSessionCookieAction as any;

export async function clearSessionCookieAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

// Backward-compatible alias
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  try {
    await clearSessionCookieAction();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error, "Abmeldung fehlgeschlagen."),
    };
  }
}
