/**
 * lib/ratelimiter.ts — Public form abuse protection (connect / jobs)
 * ==================================================================
 * Prefers Upstash Redis when configured; otherwise falls back to the shared
 * in-memory limiter so local/dev and misconfigured deploys still rate-limit.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { isRateLimited } from "./admin/rateLimit";

let upstash: Ratelimit | null = null;

const getUpstash = (): Ratelimit | null => {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return null;
    if (!upstash) {
        upstash = new Ratelimit({
            redis: new Redis({ url, token }),
            limiter: Ratelimit.slidingWindow(1, "20 s"),
        });
    }
    return upstash;
};

/**
 * @param ip client IP address
 * @returns true if the caller should be rate limited
 */
export const checkLimit = async (ip?: string): Promise<boolean> => {
    if (!ip) {
        return false;
    }

    const limiter = getUpstash();
    if (limiter) {
        try {
            const result = await limiter.limit(ip);
            return !result.success;
        } catch (err) {
            console.error("Upstash rate limit failed; using memory fallback", err);
        }
    }

    // Memory fallback (shared buckets with admin APIs).
    return isRateLimited("public_api", ip);
};
