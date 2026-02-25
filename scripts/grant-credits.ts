/**
 * One-off script to grant credits to a tenant.
 * Usage: npx tsx scripts/grant-credits.ts
 */
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!raw) {
    console.error("❌ Missing FIREBASE_SERVICE_ACCOUNT_KEY in .env.local");
    process.exit(1);
}

const serviceAccount = JSON.parse(raw);

if (getApps().length === 0) {
    initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();
const ADMIN_EMAIL = "jonatankunisch@gmail.com";
const AMOUNT = 1000;

async function main() {
    // Find the tenant for the admin email
    const usersSnap = await db.collection("users").where("email", "==", ADMIN_EMAIL).limit(1).get();

    if (usersSnap.empty) {
        // Try tenants collection directly
        console.log("No user doc found, scanning tenants...");
        const tenantsSnap = await db.collection("tenants").limit(10).get();
        for (const t of tenantsSnap.docs) {
            const data = t.data();
            console.log(`  Tenant ${t.id}: plan=${data.plan}, credits=${data.generationCredits}`);
        }

        if (tenantsSnap.docs.length === 1) {
            const tenantId = tenantsSnap.docs[0].id;
            console.log(`\nOnly one tenant found: ${tenantId}. Granting ${AMOUNT} credits...`);
            await db.collection("tenants").doc(tenantId).update({
                generationCredits: FieldValue.increment(AMOUNT),
            });
            const updated = await db.collection("tenants").doc(tenantId).get();
            console.log(`✅ Done! New balance: ${updated.data()?.generationCredits}`);
        }
        return;
    }

    const userData = usersSnap.docs[0].data();
    const tenantId = userData.tenantId;
    console.log(`Found tenant: ${tenantId}`);

    await db.collection("tenants").doc(tenantId).update({
        generationCredits: FieldValue.increment(AMOUNT),
    });

    const updated = await db.collection("tenants").doc(tenantId).get();
    console.log(`✅ Granted ${AMOUNT} credits! New balance: ${updated.data()?.generationCredits}`);
}

main().catch(console.error);
