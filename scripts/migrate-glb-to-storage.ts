import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { randomUUID } from 'crypto';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
process.env.GOOGLE_APPLICATION_CREDENTIALS = resolve(process.cwd(), 'firebase-adminsdk.json');

import { getAdminDb, getAdminApp } from '../src/lib/firebaseAdmin';
import { getStorage } from 'firebase-admin/storage';

const TENANT_ID = 'outreach-tenant';

const IDS = [
    'cc02081d-caef-43e3-b318-14b7d84c31c1',
    '9c25a4f0-99bc-4d85-bd78-68489eb2f838',
    'b3b335c5-9c9c-4f7a-bed3-3752d8646c09',
];

async function main() {
    const db = getAdminDb();
    const storage = getStorage(getAdminApp());
    const bucket = storage.bucket();

    for (const id of IDS) {
        const ref = db.collection('tenants').doc(TENANT_ID).collection('exhibitions').doc(id);
        const snap = await ref.get();
        const data = snap.data();
        if (!data) { console.log(`❌ ${id} not found`); continue; }

        const meshyUrl = data.glbUrl as string;
        if (meshyUrl.includes('firebasestorage.googleapis.com')) {
            console.log(`✅ ${id} already on Firebase Storage, skipping`);
            continue;
        }

        console.log(`⬇️  Downloading GLB for ${id}...`);
        const resp = await fetch(meshyUrl);
        if (!resp.ok) {
            console.log(`❌ ${id} download failed: HTTP ${resp.status}`);
            continue;
        }
        const buffer = Buffer.from(await resp.arrayBuffer());
        console.log(`   ${Math.round(buffer.length / 1024)}KB downloaded`);

        const downloadToken = randomUUID();
        const storagePath = `tenants/${TENANT_ID}/models/${id}.glb`;
        const file = bucket.file(storagePath);

        await file.save(buffer, {
            resumable: false,
            metadata: {
                contentType: 'model/gltf-binary',
                metadata: {
                    firebaseStorageDownloadTokens: downloadToken,
                    tenantId: TENANT_ID,
                    source: 'migration',
                },
            },
        });

        const encodedPath = encodeURIComponent(storagePath);
        const newUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${downloadToken}`;

        await ref.update({
            glbUrl: newUrl,
            'model.glbUrl': newUrl,
        });

        console.log(`✅ ${id} migrated to Firebase Storage`);
    }

    console.log('\n🎉 Migration complete!');
}

main().catch(e => console.error('ERROR:', e));
