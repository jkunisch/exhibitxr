/**
 * Creates a test exhibition in Firestore so the editor and 3D pipeline can be tested.
 */
const fs = require('fs');
const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const SA_PATH = 'C:/Users/jonat/Documents/ExhibitXR/secrets/firebase-adminsdk.json';
const ENV_PATH = path.join(__dirname, '..', '.env.local');

const envContent = fs.readFileSync(ENV_PATH, 'utf8');
const saLine = envContent.split('\n').find(l => l.startsWith('FIREBASE_SERVICE_ACCOUNT_KEY='));
const sa = JSON.parse(saLine.slice('FIREBASE_SERVICE_ACCOUNT_KEY='.length));

const app = initializeApp({ credential: cert(sa) }, 'test-exhibition-setup');
const db = getFirestore(app);

const TENANT_ID = 'demo-tenant';
const EXHIBITION_ID = 'test-pipeline';

async function main() {
    const ref = db.collection('tenants').doc(TENANT_ID).collection('exhibitions').doc(EXHIBITION_ID);
    const doc = await ref.get();

    if (doc.exists) {
        console.log('✓ Test exhibition already exists');
    } else {
        await ref.set({
            id: EXHIBITION_ID,
            tenantId: TENANT_ID,
            title: 'Pipeline Test Exhibition',
            description: 'Testing Foto→3D pipeline',
            isPublished: false,
            environment: 'studio',
            glbUrl: '',
            model: {
                id: 'model-1',
                label: 'Pipeline Test',
                glbUrl: '',
                scale: 1,
                position: [0, 0, 0],
                variants: [],
                hotspots: [],
            },
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });
        console.log('✓ Created test exhibition:', EXHIBITION_ID);
    }

    console.log('\n🔗 Open the editor:');
    console.log(`   http://localhost:3000/dashboard/editor/${EXHIBITION_ID}`);
    console.log('\n   The "Generate 3D Model" panel should be in the left sidebar.');
    console.log('   Drop a product photo there to start the Meshy pipeline.');
}

main().catch(e => { console.error(e); process.exit(1); });
