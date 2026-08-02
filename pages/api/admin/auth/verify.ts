import type { NextApiRequest, NextApiResponse } from "next";
import {
    normalizeUwEmail,
    findActiveUser,
    markEmailVerified,
} from "../../../../lib/admin/users";
import { issueToken, consumeToken } from "../../../../lib/admin/tokens";
import { clientIp, isRateLimited } from "../../../../lib/admin/rateLimit";
import { securityLog } from "../../../../lib/admin/securityLog";
import { appendAudit } from "../../../../lib/admin/audit";

/**
 * POST /api/admin/auth/request-verify  { email }
 * POST /api/admin/auth/confirm-verify  { token }
 *
 * In production, email the raw token via Postmark (EMAIL_SERVER).
 * In local/dev without mail, the token is returned once in the JSON
 * response under `devToken` (never in production).
 */
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const ip = clientIp(req);

    if (req.method === "POST" && req.query.action === "request") {
        if (isRateLimited("account", ip)) {
            securityLog("rate_limited", { bucket: "account", ip });
            return res.status(429).json({ error: "Too many requests" });
        }
        const email = normalizeUwEmail(String(req.body?.email || ""));
        // Always return generic OK to avoid email enumeration.
        if (!email || !findActiveUser(email)) {
            return res.status(200).json({ ok: true });
        }
        const { raw, expiresAt } = issueToken(email, "email_verify");
        securityLog("email_verify", { action: "issued", email, ip });
        appendAudit({
            action: "email_verify_issue",
            email,
            detail: `exp=${expiresAt}`,
            ok: true,
        });

        // TODO: send email with link `${NEXTAUTH_URL}/admin/verify?token=...`
        const payload: Record<string, unknown> = { ok: true };
        if (process.env.NODE_ENV !== "production") {
            payload.devToken = raw;
        }
        return res.status(200).json(payload);
    }

    if (req.method === "POST" && req.query.action === "confirm") {
        if (isRateLimited("account", ip)) {
            return res.status(429).json({ error: "Too many requests" });
        }
        const token = String(req.body?.token || "");
        const email = consumeToken(token, "email_verify");
        if (!email) {
            securityLog("email_verify", { action: "invalid_token", ip });
            return res.status(400).json({ error: "Invalid or expired token" });
        }
        markEmailVerified(email);
        securityLog("email_verify", { action: "confirmed", email, ip });
        return res.status(200).json({ ok: true, email });
    }

    return res.status(400).json({
        error: "Use ?action=request or ?action=confirm",
    });
}
