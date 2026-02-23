import {
  initializeApp,
  getApps,
  cert,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let cachedAdminApp: App | null = null;

function readServiceAccount(): ServiceAccount {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_KEY environment variable.");
  }

  try {
    return JSON.parse(raw) as ServiceAccount;
  } catch {
    throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT_KEY JSON.");
  }
}

/** Server-side Firebase Admin app (singleton, lazily initialized). */
export function getAdminApp(): App {
  if (cachedAdminApp) {
    return cachedAdminApp;
  }

  if (getApps().length > 0) {
    cachedAdminApp = getApps()[0] ?? null;
    if (cachedAdminApp) {
      return cachedAdminApp;
    }
  }

  const serviceAccount = readServiceAccount();
  cachedAdminApp = initializeApp({ credential: cert(serviceAccount) });

  return cachedAdminApp;
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}
