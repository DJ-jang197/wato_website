import type { NextApiRequest, NextApiResponse } from "next";
import { getAuthedAdmin } from "../../../lib/admin/requireAuth";
import { clientIp, isRateLimited } from "../../../lib/admin/rateLimit";
import { securityLog } from "../../../lib/admin/securityLog";

/**
 * POST /api/ai/generate — placeholder for future AI generation.
 * Auth required + strict rate limit so bots cannot burn quota if wired later.
 * Does not call any model today — returns 501 until a provider is configured.
 */
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const ip = clientIp(req);

    if (isRateLimited("ai", ip)) {
        securityLog("rate_limited", { bucket: "ai", ip, path: req.url });
        return res.status(429).json({ error: "Too many AI requests" });
    }

    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).json({ error: "Method not allowed" });
    }

    const user = await getAuthedAdmin(req, res);
    if (!user) {
        securityLog("api_denied", { path: req.url, ip, reason: "unauth" });
        return res.status(401).json({ error: "Unauthorized" });
    }

    securityLog("api_error", {
        path: req.url,
        email: user.email,
        error: "ai_not_configured",
    });

    return res.status(501).json({
        error: "AI generation is not configured on this deployment.",
    });
}
