import {
  initializeApp,
  getApps,
  cert,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";

let cachedAdminApp: App | null = null;

function readServiceAccount(): ServiceAccount {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (raw) {
    try {
      return JSON.parse(raw) as ServiceAccount;
    } catch {
      // dotenv v17 expands \n in values to real newline chars (0x0A).
      // JSON.parse rejects raw newlines inside string values.
      // Fix: re-escape real newlines back to \n before parsing.
      try {
        const fixed = raw.replace(/\n/g, "\\n").replace(/\r/g, "\\r");
        return JSON.parse(fixed) as ServiceAccount;
      } catch {
        // fall through to file-based fallback
      }
    }
  }

  // Fallback: read from JSON file (GOOGLE_APPLICATION_CREDENTIALS)
  const filePath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (filePath) {
    try {
      const content = readFileSync(filePath, "utf-8");
      return JSON.parse(content) as ServiceAccount;
    } catch (e) {
      throw new Error(`Failed to read GOOGLE_APPLICATION_CREDENTIALS file: ${e}`);
    }
  }

  throw new Error(
    "Missing Firebase credentials. Set FIREBASE_SERVICE_ACCOUNT_KEY (JSON string) or GOOGLE_APPLICATION_CREDENTIALS (path to JSON file).",
  );
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
  cachedAdminApp = initializeApp({
    credential: cert(serviceAccount),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });

  return cachedAdminApp;
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}
