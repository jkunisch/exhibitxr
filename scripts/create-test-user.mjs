/**
 * Creates a test user in Firebase Auth with a tenantId custom claim.
 *
 * Usage:
 *   node scripts/create-test-user.mjs
 *
 * Uses the same FIREBASE_SERVICE_ACCOUNT_KEY from .env.local.
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env.local');

// Parse .env.local manually
const envContent = readFileSync(envPath, 'utf8');
const saLine = envContent.split('\n').find(l => l.startsWith('FIREBASE_SERVICE_ACCOUNT_KEY='));
if (!saLine) {
    console.error('❌ FIREBASE_SERVICE_ACCOUNT_KEY not found in .env.local');
    process.exit(1);
}
const sa = JSON.parse(saLine.slice('FIREBASE_SERVICE_ACCOUNT_KEY='.length));

// Init Firebase Admin
const app = initializeApp({ credential: cert(sa) });
const auth = getAuth(app);
const db = getFirestore(app);

// User config
const TEST_EMAIL = 'demo@exhibitxr.com';
const TEST_PASSWORD = 'ExhibitXR2026!';
const TENANT_ID = 'demo-tenant';

async function main() {
    let user;

    try {
        user = await auth.getUserByEmail(TEST_EMAIL);
        console.log('✓ User already exists:', user.uid);
    } catch {
        user = await auth.createUser({
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
            displayName: 'Demo User',
        });
        console.log('✓ Created user:', user.uid);
    }

    // Set tenantId custom claim
    await auth.setCustomUserClaims(user.uid, { tenantId: TENANT_ID });
    console.log('✓ Set tenantId claim:', TENANT_ID);

    // Create tenant doc in Firestore if it doesn't exist
    const tenantRef = db.collection('tenants').doc(TENANT_ID);
    const tenantDoc = await tenantRef.get();
    if (!tenantDoc.exists) {
        await tenantRef.set({
            name: 'Demo Tenant',
            ownerId: user.uid,
            createdAt: new Date(),
        });
        console.log('✓ Created tenant document');
    } else {
        console.log('✓ Tenant document already exists');
    }

    console.log('\n🚀 Login credentials:');
    console.log(`   Email:    ${TEST_EMAIL}`);
    console.log(`   Password: ${TEST_PASSWORD}`);
    console.log(`   URL:      http://localhost:3000/login`);
}

main().catch(e => { console.error(e); process.exit(1); });
