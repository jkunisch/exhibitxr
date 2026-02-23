import { cookies } from "next/headers";

import { getAdminAuth } from "@/lib/firebaseAdmin";

const SESSION_COOKIE_NAME = "session";

export type SessionUser = {
  uid: string;
  email: string | null;
  tenantId: string;
  role: string | null;
};

function claimAsString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const adminAuth = getAdminAuth();
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    const tenantId = claimAsString(decodedToken.tenantId);

    if (!tenantId) {
      return null;
    }

    return {
      uid: decodedToken.uid,
      email: decodedToken.email ?? null,
      tenantId,
      role: claimAsString(decodedToken.role),
    };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("FIREBASE_SERVICE_ACCOUNT_KEY")
    ) {
      throw error;
    }

    return null;
  }
}
