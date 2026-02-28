import * as dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
process.env.GOOGLE_APPLICATION_CREDENTIALS = resolve(process.cwd(), 'firebase-adminsdk.json');

import { getAdminDb } from '../src/lib/firebaseAdmin';

const IDS = [
    'cc02081d-caef-43e3-b318-14b7d84c31c1', // 3DPrintNovesia
    '9c25a4f0-99bc-4d85-bd78-68489eb2f838', // 3DMichel
    'b3b335c5-9c9c-4f7a-bed3-3752d8646c09', // CAT LOURI
];

async function main() {
    const db = getAdminDb();
    for (const id of IDS) {
        const ref = db.collection('tenants').doc('outreach-tenant').collection('exhibitions').doc(id);
        await ref.update({ autoRotate: true, bgColor: '#18181b' });
        console.log(`✅ Patched: ${id}`);
    }
    console.log('Done!');
}

main().catch(e => console.error(e));
