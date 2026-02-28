import * as dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
process.env.GOOGLE_APPLICATION_CREDENTIALS = resolve(process.cwd(), 'firebase-adminsdk.json');

import { getAdminDb } from '../src/lib/firebaseAdmin';
import { parseExhibitConfig } from '../src/lib/validateConfig';
import { FieldPath } from 'firebase-admin/firestore';

const ID = 'cc02081d-caef-43e3-b318-14b7d84c31c1';

async function main() {
    const db = getAdminDb();

    // exactly how the embed page does it
    let snapshot = await db
        .collectionGroup('exhibitions')
        .where('id', '==', ID)
        .limit(1)
        .get();

    if (snapshot.empty) {
        snapshot = await db
            .collectionGroup('exhibitions')
            .where(FieldPath.documentId(), '==', ID)
            .limit(1)
            .get();
    }

    console.log('docs found:', snapshot.size);
    if (snapshot.empty) { console.log('NOT FOUND'); return; }

    const doc = snapshot.docs[0];
    const data = doc.data();
    console.log('isPublished:', data.isPublished);
    console.log('tenantId:', data.tenantId ?? doc.ref.parent.parent?.id);

    const rawConfig = (typeof data.config === 'object' && data.config !== null)
        ? data.config
        : data;

    const configInput = { ...rawConfig as Record<string, unknown>, id: ID, tenantId: data.tenantId };

    try {
        const config = parseExhibitConfig(configInput);
        console.log('✅ PARSE OK:', config.title);
    } catch (e) {
        console.log('❌ PARSE FAIL:', (e as Error).message);
    }
}

main().catch(e => console.error('TOP ERR:', e));
