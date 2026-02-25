/**
 * One-off script to set `plan: "free"` on all tenants missing the field.
 * Usage: npx tsx scripts/fix-tenant-plan.ts
 */
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);
if (!getApps().length) initializeApp({ credential: cert(sa) });

const db = getFirestore();

async function main() {
    const snap = await db.collection("tenants").get();
    let fixed = 0;

    for (const doc of snap.docs) {
        const data = doc.data();
        if (!data.plan) {
            await db.collection("tenants").doc(doc.id).update({ plan: "free" });
            console.log(`✅ ${doc.id} → plan: "free"`);
            fixed++;
        } else {
            console.log(`   ${doc.id} → plan: "${data.plan}" (OK)`);
        }
    }

    console.log(`\nDone. Fixed ${fixed} tenant(s).`);
    process.exit(0);
}

main().catch(console.error);
