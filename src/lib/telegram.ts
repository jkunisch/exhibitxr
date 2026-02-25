import "server-only";

/**
 * Send a Telegram notification to the admin when a non-admin user
 * generates a 3D model. Fire-and-forget — never throws.
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID ?? "";

const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

export async function notifyModelGeneration(opts: {
    email?: string | null;
    provider: string;
    ip?: string | null;
}): Promise<void> {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;

    const who = opts.email ?? `Anonym (${opts.ip ?? "unknown IP"})`;
    const providerLabel = opts.provider === "basic" ? "Tripo (Basic)" : "Meshy (Premium)";
    const time = new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" });

    const text =
        `🧊 *Neue 3D-Generierung*\n\n` +
        `👤 ${escapeMarkdown(who)}\n` +
        `⚙️ Provider: ${providerLabel}\n` +
        `🕐 ${time}`;

    try {
        await fetch(TELEGRAM_API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text,
                parse_mode: "Markdown",
            }),
        });
    } catch {
        // Fire-and-forget — never block generation
        console.warn("[telegram] Failed to send notification");
    }
}

function escapeMarkdown(text: string): string {
    return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
}
