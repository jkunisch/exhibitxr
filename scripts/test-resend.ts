/**
 * Quick Resend send test
 */
import * as dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function main() {
    console.log('📧 Sende Test-Mail via Resend...');

    const { data, error } = await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: 'jonatankunisch@gmail.com',
        subject: '✅ 3D-Snap Resend Test',
        html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #00aaff;">3D-Snap ⚡</h1>
        <p style="font-size: 18px; color: #333;">Resend funktioniert!</p>
        <p style="color: #666;">Die E-Mail-Pipeline für <strong>3D-Snap Outreach</strong> ist einsatzbereit.</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999;">Gesendet am ${new Date().toLocaleString('de-DE')}</p>
      </div>
    `,
    });

    if (error) {
        console.error('❌ Fehler:', JSON.stringify(error, null, 2));
    } else {
        console.log('✅ Test-Mail gesendet!');
        console.log(`   ID: ${data?.id}`);
        console.log('   An: jonatankunisch@gmail.com');
    }
}

main().catch(e => console.error(e));
