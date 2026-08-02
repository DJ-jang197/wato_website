/**
 * lib/admin/posts.ts — Safe create/update of blog markdown + ownership
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { getBlogs, getBlogData } from "../blogsDAL";
import { BlogPostData } from "../../types";
import { AdminRole, isAdminRole } from "./users";

export interface PostActor {
    email: string;
    role: AdminRole;
}

const BLOGS_DIR = path.join(process.cwd(), "static", "blogs");

export interface BlogPostInput {
    id: string;
    title: string;
    date: string;
    image: string;
    description: string;
    tags: string[];
    authors: string[];
    spotlight: boolean;
    body: string;
    /** Authenticated owner email — used for IDOR ownership checks. */
    ownerEmail?: string;
}

/** Only allow lowercase slug ids: eve-urban-autonomy */
export const sanitizePostId = (raw: string): string | null => {
    const original = String(raw || "").trim();
    if (
        !original ||
        original.includes("..") ||
        original.includes("/") ||
        original.includes("\\") ||
        original.includes("\0")
    ) {
        return null;
    }

    const id = original
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
    if (!id || id.length > 80 || id.startsWith("-") || id.endsWith("-")) {
        return null;
    }
    return id;
};

const resolvePostPath = (id: string): string | null => {
    const safeId = sanitizePostId(id);
    if (!safeId) return null;
    const blogsRoot = path.resolve(BLOGS_DIR);
    const filePath = path.resolve(BLOGS_DIR, `${safeId}.md`);
    const relative = path.relative(blogsRoot, filePath);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
        return null;
    }
    return filePath;
};

const escapeYamlString = (value: string): string => {
    return `'${String(value).replace(/'/g, "''")}'`;
};

const formatStringList = (items: string[]): string => {
    const cleaned = items
        .map((t) => String(t).trim())
        .filter(Boolean)
        .map((t) => escapeYamlString(t));
    return `[${cleaned.join(", ")}]`;
};

export const buildMarkdown = (input: BlogPostInput): string => {
    const lines = [
        "---",
        `title: ${escapeYamlString(input.title.trim())}`,
        `date: ${escapeYamlString(input.date.trim())}`,
        `image: ${escapeYamlString(input.image.trim())}`,
        `description: ${escapeYamlString(input.description.trim())}`,
        `tags: ${formatStringList(input.tags)}`,
        `authors: ${formatStringList(input.authors)}`,
        `spotlight: ${input.spotlight ? "true" : "false"}`,
    ];
    if (input.ownerEmail) {
        lines.push(`ownerEmail: ${escapeYamlString(input.ownerEmail)}`);
    }
    lines.push("---", "", input.body.replace(/^\uFEFF/, "").trimEnd(), "");
    return lines.join("\n");
};

export const validatePostInput = (
    input: Partial<BlogPostInput>
): string | null => {
    if (!input.title?.trim()) return "Title is required.";
    if (!input.date?.trim()) return "Date is required.";
    if (!input.image?.trim()) return "Image path is required.";
    if (!input.image.startsWith("/"))
        return "Image must be a site path starting with / (e.g. /imgs/...).";
    if (input.image.includes("..")) return "Image path is invalid.";
    if (!input.description?.trim()) return "Description is required.";
    if (!input.body?.trim()) return "Body markdown is required.";
    if (!input.tags || input.tags.length === 0) return "At least one tag is required.";
    if (!input.authors || input.authors.length === 0)
        return "At least one author is required.";
    if (!sanitizePostId(input.id || "")) return "Post id/slug is invalid.";
    return null;
};

export const listAdminPosts = (): BlogPostData[] => getBlogs().all;

export const readOwnerEmail = (id: string): string | null => {
    const filePath = resolvePostPath(id);
    if (!filePath || !fs.existsSync(filePath)) return null;
    const parsed = matter(fs.readFileSync(filePath, "utf8"));
    const owner = parsed.data.ownerEmail;
    return typeof owner === "string" ? owner.toLowerCase() : null;
};

/**
 * IDOR guard: admins may access any post; authors only their owned posts.
 * Legacy posts without ownerEmail are admin-only for mutate/read-in-admin.
 */
export const canAccessPost = (
    user: PostActor,
    id: string,
    mode: "read" | "write" | "delete"
): boolean => {
    if (isAdminRole(user.role)) return true;
    if (mode === "delete") return false; // authors cannot delete
    const owner = readOwnerEmail(id);
    if (!owner) return false;
    return owner === user.email.toLowerCase();
};

export const readPostForEdit = async (
    id: string
): Promise<{ meta: BlogPostData; body: string; ownerEmail: string | null } | null> => {
    const filePath = resolvePostPath(id);
    if (!filePath || !fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = matter(raw);
    const meta = await getBlogData(sanitizePostId(id)!);
    const ownerEmail =
        typeof parsed.data.ownerEmail === "string"
            ? parsed.data.ownerEmail.toLowerCase()
            : null;
    return { meta, body: parsed.content.trim(), ownerEmail };
};

export const writePost = (
    input: BlogPostInput,
    options: { overwrite: boolean }
): { ok: true; id: string } | { ok: false; error: string } => {
    const validationError = validatePostInput(input);
    if (validationError) return { ok: false, error: validationError };

    const filePath = resolvePostPath(input.id!);
    if (!filePath) return { ok: false, error: "Invalid post id." };

    if (!options.overwrite && fs.existsSync(filePath)) {
        return { ok: false, error: "A post with this id already exists." };
    }
    if (options.overwrite && !fs.existsSync(filePath)) {
        return { ok: false, error: "Post not found." };
    }

    // Preserve existing owner on update if not explicitly passed.
    if (options.overwrite && !input.ownerEmail) {
        const existing = readOwnerEmail(input.id!);
        if (existing) input.ownerEmail = existing;
    }

    const markdown = buildMarkdown(input as BlogPostInput);
    fs.writeFileSync(filePath, markdown, "utf8");
    return { ok: true, id: sanitizePostId(input.id!)! };
};

export const deletePost = (
    id: string
): { ok: true } | { ok: false; error: string } => {
    const filePath = resolvePostPath(id);
    if (!filePath || !fs.existsSync(filePath)) {
        return { ok: false, error: "Post not found." };
    }
    fs.unlinkSync(filePath);
    return { ok: true };
};
