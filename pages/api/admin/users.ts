import type { NextApiRequest, NextApiResponse } from "next";
import {
    getAuthedAdmin,
    requireAdminRole,
} from "../../../lib/admin/requireAuth";
import { loadAllUsers } from "../../../lib/admin/users";
import { clientIp, isRateLimited } from "../../../lib/admin/rateLimit";
import { securityLog } from "../../../lib/admin/securityLog";

/**
 * GET /api/admin/users — list allowlisted spreadsheet rows (no passwords).
 * Admin role only. Authors cannot enumerate the full allowlist (IDOR/privacy).
 */
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const ip = clientIp(req);
    if (isRateLimited("admin_api", ip)) {
        securityLog("rate_limited", { bucket: "admin_api", ip, path: req.url });
        return res.status(429).json({ error: "Too many requests" });
    }

    const user = await getAuthedAdmin(req, res);
    if (!user) {
        securityLog("api_denied", { path: req.url, ip, reason: "unauth" });
        return res.status(401).json({ error: "Unauthorized" });
    }
    if (!requireAdminRole(user)) {
        securityLog("idor_blocked", {
            email: user.email,
            path: req.url,
            mode: "read",
        });
        return res.status(403).json({ error: "Forbidden" });
    }
    if (req.method !== "GET") {
        res.setHeader("Allow", "GET");
        return res.status(405).json({ error: "Method not allowed" });
    }

    // Never expose password material — CSV has none; email/name/role only.
    const users = loadAllUsers().map(({ email, name, role, active }) => ({
        email,
        name,
        role,
        active,
    }));

    return res.status(200).json({ users });
}
