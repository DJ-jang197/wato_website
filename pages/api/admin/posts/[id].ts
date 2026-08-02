import type { NextApiRequest, NextApiResponse } from "next";
import {
    getAuthedAdmin,
    requireAdminRole,
} from "../../../../lib/admin/requireAuth";
import {
    deletePost,
    readPostForEdit,
    writePost,
    canAccessPost,
    BlogPostInput,
} from "../../../../lib/admin/posts";
import { appendAudit } from "../../../../lib/admin/audit";
import { clientIp, isRateLimited } from "../../../../lib/admin/rateLimit";
import { securityLog } from "../../../../lib/admin/securityLog";

/**
 * GET / PUT / DELETE /api/admin/posts/[id]
 * Enforces ownership (IDOR): authors only touch their own posts.
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

    const id = String(req.query.id || "");

    if (req.method === "GET") {
        if (!canAccessPost(user, id, "read")) {
            securityLog("idor_blocked", {
                email: user.email,
                id,
                mode: "read",
            });
            return res.status(403).json({ error: "Forbidden" });
        }
        const post = await readPostForEdit(id);
        if (!post) return res.status(404).json({ error: "Not found" });
        return res.status(200).json({
            id: post.meta.id,
            title: post.meta.title,
            date: post.meta.date,
            image: post.meta.image,
            description: post.meta.description,
            tags: post.meta.tags,
            authors: post.meta.authors,
            spotlight: Boolean(post.meta.spotlight),
            body: post.body,
            ownerEmail: post.ownerEmail,
        });
    }

    if (req.method === "PUT") {
        if (!canAccessPost(user, id, "write")) {
            securityLog("idor_blocked", {
                email: user.email,
                id,
                mode: "write",
            });
            return res.status(403).json({ error: "Forbidden" });
        }
        const body = req.body as Partial<BlogPostInput>;
        // Callers cannot reassign ownership to another user via IDOR.
        const ownerEmail = requireAdminRole(user)
            ? body.ownerEmail || user.email
            : user.email;

        const result = writePost(
            {
                id,
                title: body.title || "",
                date: body.date || "",
                image: body.image || "",
                description: body.description || "",
                tags: Array.isArray(body.tags) ? body.tags : [],
                authors: Array.isArray(body.authors) ? body.authors : [],
                spotlight: Boolean(body.spotlight),
                body: body.body || "",
                ownerEmail,
            },
            { overwrite: true }
        );

        appendAudit({
            action: "post_update",
            email: user.email,
            detail: result.ok ? `id=${id}` : result.error,
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
        return res.status(200).json({ id: result.id });
    }

    if (req.method === "DELETE") {
        if (!canAccessPost(user, id, "delete")) {
            securityLog("idor_blocked", {
                email: user.email,
                id,
                mode: "delete",
            });
            return res.status(403).json({ error: "Forbidden" });
        }
        const result = deletePost(id);
        appendAudit({
            action: "post_delete",
            email: user.email,
            detail: result.ok ? `id=${id}` : result.error,
            ok: result.ok,
        });
        if (!result.ok) {
            return res.status(400).json({ error: result.error });
        }
        return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", "GET, PUT, DELETE");
    return res.status(405).json({ error: "Method not allowed" });
}
