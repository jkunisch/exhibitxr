import "server-only";

/**
 * Simple in-memory sliding-window rate limiter.
 * No external dependencies — uses a Map with automatic cleanup.
 *
 * Designed for serverless/edge: resets on cold starts, which is
 * acceptable for abuse prevention (not billing-grade metering).
 *
 * @security-note This in-memory limiter resets on each cold start and
 * is not shared across isolates. In a Cloudflare Workers / serverless
 * environment, attackers can bypass it by hitting different isolates.
 * For production, Cloudflare WAF rate limiting must be the primary guard
 * for /api/snap-preview. This limiter stays as best-effort defense in depth.
 * If app-level shared quotas are needed, add a KV/D1-backed counter.
 */

interface WindowEntry {
    timestamps: number[];
}

const store = new Map<string, WindowEntry>();

// Cleanup stale entries every 10 minutes
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
    const now = Date.now();
    if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
    lastCleanup = now;

    const cutoff = now - windowMs;
    for (const [key, entry] of store) {
        entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
        if (entry.timestamps.length === 0) {
            store.delete(key);
        }
    }
}

/**
 * Check if a request is allowed under the rate limit.
 *
 * @param key    - Unique identifier (e.g. IP address)
 * @param limit  - Max requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns { allowed, remaining, retryAfterMs }
 */
export function checkRateLimit(
    key: string,
    limit: number,
    windowMs: number,
): { allowed: boolean; remaining: number; retryAfterMs: number } {
    cleanup(windowMs);

    const now = Date.now();
    const cutoff = now - windowMs;

    let entry = store.get(key);
    if (!entry) {
        entry = { timestamps: [] };
        store.set(key, entry);
    }

    // Remove expired timestamps
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

    if (entry.timestamps.length >= limit) {
        const oldestInWindow = entry.timestamps[0]!;
        const retryAfterMs = oldestInWindow + windowMs - now;
        return { allowed: false, remaining: 0, retryAfterMs };
    }

    entry.timestamps.push(now);
    return {
        allowed: true,
        remaining: limit - entry.timestamps.length,
        retryAfterMs: 0,
    };
}
