import type { NextApiRequest, NextApiResponse } from "next";
import { normalizeUwEmail, findActiveUser } from "../../../../lib/admin/users";
import { issueToken, consumeToken } from "../../../../lib/admin/tokens";
import { setPasswordHashForEmail } from "../../../../lib/admin/passwordStore";
import { clientIp, isRateLimited } from "../../../../lib/admin/rateLimit";
import { securityLog } from "../../../../lib/admin/securityLog";
import { appendAudit } from "../../../../lib/admin/audit";

/**
 * POST /api/admin/auth/reset?action=request  { email }
 * POST /api/admin/auth/reset?action=confirm  { token, password }
 * Reset tokens expire in 1 hour (see tokens.ts).
 */
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const ip = clientIp(req);

    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).json({ error: "Method not allowed" });
    }

    if (isRateLimited("password_reset", ip)) {
        securityLog("rate_limited", { bucket: "password_reset", ip });
        return res.status(429).json({ error: "Too many requests" });
    }

    const action = String(req.query.action || "");

    if (action === "request") {
        const email = normalizeUwEmail(String(req.body?.email || ""));
        // Generic response — no enumeration.
        if (email && findActiveUser(email)) {
            const { raw, expiresAt } = issueToken(email, "password_reset");
            securityLog("password_reset", { action: "issued", email, ip });
            appendAudit({
                action: "password_reset_issue",
                email,
                detail: `exp=${expiresAt}`,
                ok: true,
            });
            const payload: Record<string, unknown> = { ok: true };
            if (process.env.NODE_ENV !== "production") {
                payload.devToken = raw;
            }
            return res.status(200).json(payload);
        }
        return res.status(200).json({ ok: true });
    }

    if (action === "confirm") {
        const token = String(req.body?.token || "");
        const password = String(req.body?.password || "");
        const email = consumeToken(token, "password_reset");
        if (!email) {
            securityLog("password_reset", { action: "invalid_token", ip });
            return res.status(400).json({ error: "Invalid or expired token" });
        }
        try {
            await setPasswordHashForEmail(email, password);
        } catch (e) {
            return res.status(400).json({
                error: e instanceof Error ? e.message : "Invalid password",
            });
        }
        securityLog("password_reset", { action: "confirmed", email, ip });
        appendAudit({
            action: "password_reset_confirm",
            email,
            detail: "ok",
            ok: true,
        });
        return res.status(200).json({ ok: true });
    }

    return res.status(400).json({
        error: "Use ?action=request or ?action=confirm",
    });
}
