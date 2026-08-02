import type { NextApiRequest, NextApiResponse } from "next";
import { getAuthedAdmin } from "../../../../lib/admin/requireAuth";
import {
    listAdminPosts,
    writePost,
    canAccessPost,
    BlogPostInput,
} from "../../../../lib/admin/posts";
import { appendAudit } from "../../../../lib/admin/audit";
import { clientIp, isRateLimited } from "../../../../lib/admin/rateLimit";
import { securityLog } from "../../../../lib/admin/securityLog";

/**
 * GET  /api/admin/posts — list posts the caller may access
 * POST /api/admin/posts — create post (sets ownerEmail = caller)
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

    if (req.method === "GET") {
        const all = listAdminPosts();
        const posts = all.filter((p) => canAccessPost(user, p.id, "read"));
        return res.status(200).json({ posts });
    }

    if (req.method === "POST") {
        const body = req.body as Partial<BlogPostInput>;
        const result = writePost(
            {
                id: body.id || "",
                title: body.title || "",
                date: body.date || "",
                image: body.image || "",
                description: body.description || "",
                tags: Array.isArray(body.tags) ? body.tags : [],
                authors: Array.isArray(body.authors) ? body.authors : [],
                spotlight: Boolean(body.spotlight),
                body: body.body || "",
                ownerEmail: user.email,
            },
            { overwrite: false }
        );

        appendAudit({
            action: "post_create",
            email: user.email,
            detail: result.ok ? `id=${result.id}` : result.error,
            ok: result.ok,
        });

        if (!result.ok) {
            securityLog("api_error", {
                path: req.url,
                email: user.email,
                error: result.error,
            });
            return res.status(400).json({ error: result.error });
        }
        return res.status(201).json({ id: result.id });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
}
