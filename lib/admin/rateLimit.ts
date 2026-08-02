/**
 * lib/admin/rateLimit.ts — Shared in-memory abuse protection
 * ==========================================================
 * Buckets for login, admin APIs, public APIs, account flows, and future AI.
 * Falls back to memory so local/dev works without Upstash Redis.
 * Does NOT replace Upstash for high-traffic production mail forms — see lib/ratelimiter.ts.
 */

interface Bucket {
    count: number;
    resetAt: number;
}

export type RateLimitBucket =
    | "login"
    | "admin_api"
    | "public_api"
    | "account"
    | "password_reset"
    | "ai";

const CONFIG: Record<
    RateLimitBucket,
    { windowMs: number; max: number }
> = {
    login: { windowMs: 15 * 60 * 1000, max: 8 },
    admin_api: { windowMs: 60 * 1000, max: 60 },
    public_api: { windowMs: 60 * 1000, max: 120 },
    account: { windowMs: 60 * 60 * 1000, max: 5 },
    password_reset: { windowMs: 60 * 60 * 1000, max: 5 },
    ai: { windowMs: 60 * 1000, max: 10 },
};

const store = new Map<string, Bucket>();

const keyOf = (bucket: RateLimitBucket, id: string) => `${bucket}:${id}`;

/**
 * @returns true if the caller should be blocked (over limit).
 */
export const isRateLimited = (
    bucket: RateLimitBucket,
    id: string
): boolean => {
    const cfg = CONFIG[bucket];
    const key = keyOf(bucket, id || "unknown");
    const now = Date.now();
    const existing = store.get(key);

    if (!existing || now > existing.resetAt) {
        store.set(key, { count: 1, resetAt: now + cfg.windowMs });
        return false;
    }

    existing.count += 1;
    return existing.count > cfg.max;
};

export const clearRateLimit = (bucket: RateLimitBucket, id: string): void => {
    store.delete(keyOf(bucket, id || "unknown"));
};

/** Client IP helper for API routes. */
export const clientIp = (req: {
    headers: Record<string, string | string[] | undefined>;
    socket?: { remoteAddress?: string };
}): string => {
    const forwarded = req.headers["x-forwarded-for"];
    const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    if (raw) return raw.split(",")[0].trim();
    const real = req.headers["x-real-ip"];
    if (typeof real === "string" && real) return real;
    return req.socket?.remoteAddress || "unknown";
};
