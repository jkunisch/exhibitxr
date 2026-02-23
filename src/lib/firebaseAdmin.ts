import {
    initializeApp,
    getApps,
    cert,
    type ServiceAccount,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getAdminApp() {
    if (getApps().length > 0) {
        return getApps()[0];
    }

    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!raw) {
        throw new Error(
            "Missing FIREBASE_SERVICE_ACCOUNT_KEY environment variable."
        );
    }

    const serviceAccount = JSON.parse(raw) as ServiceAccount;
    return initializeApp({ credential: cert(serviceAccount) });
}

/** Server-side Firebase Admin app (singleton). */
export const adminApp = getAdminApp();
export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);