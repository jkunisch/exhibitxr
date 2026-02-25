import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);
if (!getApps().length) initializeApp({ credential: cert(sa) });

const db = getFirestore();
db.collection("tenants").limit(5).get().then(s => {
    s.docs.forEach(d => {
        const data = d.data();
        console.log(d.id, "| credits:", data.generationCredits, "| plan:", data.plan);
    });
    process.exit(0);
});
