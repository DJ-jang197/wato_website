/**
 * blogsDAL.ts — Blog Data Access Layer
 * =====================================
 * BEGINNER NOTE:
 * A "DAL" is just a helper module that knows how to READ blog content from disk
 * and turn it into JavaScript objects the React pages can render.
 *
 * Where do blog posts live?
 *   static/blogs/*.md   ← each .md file is one blog post
 *
 * What does a post file look like?
 *   ---
 *   title: 'My Post'
 *   date: 'March 12 2026'
 *   image: '/imgs/projects/eve/eve-hero.jpg'
 *   description: 'Short blurb'
 *   tags: ['EVE', 'Perception']
 *   authors: ['WATonomous Autonomy Team']
 *   spotlight: true
 *   ---
 *
 *   # Markdown body starts here...
 *
 * Tools used:
 *   - gray-matter  → splits the YAML "frontmatter" (metadata) from the markdown body
 *   - remark       → converts markdown body into HTML for the article page
 *
 * PRD Workstreams that use this file:
 *   B — real content lives under static/blogs
 *   C — getBlogs().spotlight feeds the Spotlight carousel
 *   D — getBlogs().tags feeds the tag filter UI
 *   E — getRelatedPosts() powers "Related posts" on article pages
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";

import { remark } from "remark";
import html from "remark-html";
import { BlogPostData } from "../types";
import { pickRelatedPosts } from "./blogRelated";

/**
 * Shape returned by getBlogs().
 * - featured: newest 3 posts (used by the "Featured" grid)
 * - spotlight: posts with frontmatter spotlight: true (used by Spotlight carousel)
 * - all: every post, newest first
 * - tags: unique tag strings across all posts (used by tag filter chips)
 */
interface BlogsInterface {
    featured: BlogPostData[];
    spotlight: BlogPostData[];
    all: BlogPostData[];
    tags: string[];
}

/** Absolute path to the folder of markdown blog files. */
const PATH = path.join(process.cwd(), "/static/blogs");

/**
 * BEGINNER NOTE — which files count as blog posts?
 * We only load `*.md` files that look like real posts (have a title in
 * frontmatter). Helper docs (like HOW_TO_ADD_A_POST.txt) must NOT use `.md`
 * or they will crash the listing page when `tags` / `authors` are missing.
 */
const listPostFilenames = (): string[] => {
    return fs
        .readdirSync(PATH)
        .filter((f) => f.endsWith(".md"))
        .filter((f) => {
            // Skip common non-post names just in case someone adds them as .md
            const lower = f.toLowerCase();
            if (lower === "readme.md") return false;
            return true;
        });
};

/**
 * Sort helper: newer dates first.
 * Date.parse understands strings like "March 12 2026".
 */
const sortByDate = (a: BlogPostData, b: BlogPostData) => {
    return Date.parse(String(b.date)) - Date.parse(String(a.date));
};

/**
 * Normalize frontmatter fields so a slightly incomplete .md file does not
 * crash the whole /blogs page (e.g. missing tags → empty array, not undefined).
 */
const normalizePostFields = (
    id: string,
    data: Record<string, unknown>,
    contentHtml: string
): BlogPostData | null => {
    // No title → not a real post (likely a leftover doc). Skip it.
    if (typeof data.title !== "string" || !data.title.trim()) {
        return null;
    }

    const tags = Array.isArray(data.tags)
        ? (data.tags as string[])
        : [];
    const authors = Array.isArray(data.authors)
        ? (data.authors as string[])
        : [];

    return {
        id,
        title: data.title,
        date: (data.date as string) ?? "",
        authors,
        description: typeof data.description === "string" ? data.description : "",
        tags,
        image: typeof data.image === "string" ? data.image : "",
        contentHtml,
        spotlight: Boolean(data.spotlight),
    };
};

/**
 * Read one markdown file and return a BlogPostData object WITHOUT converting
 * the body to HTML. Used for listing cards / search / spotlight (we only need
 * metadata there, not the full article HTML).
 *
 * Returns null if the file is not a valid post (skipped by getBlogs).
 */
const readBlogMeta = (filename: string): BlogPostData | null => {
    const id = filename.replace(/\.md$/, "");
    const filePath = path.join(PATH, filename);
    const content = fs.readFileSync(filePath, "utf8");
    const parsedContent = matter(content);

    return normalizePostFields(id, parsedContent.data, "");
};

/**
 * Load every blog post's metadata for the /blogs listing page.
 */
export const getBlogs = (): BlogsInterface => {
    const files = listPostFilenames();
    const blogs: BlogsInterface = {
        featured: [],
        spotlight: [],
        all: [],
        tags: [],
    };
    const tags = new Set<string>();

    files.forEach((filename) => {
        const post = readBlogMeta(filename);
        // Skip invalid / non-post markdown files instead of crashing.
        if (!post) return;

        // Spotlight carousel only shows posts flagged in frontmatter.
        if (post.spotlight) {
            blogs.spotlight.push(post);
        }

        blogs.all.push(post);

        // Collect unique tags for the filter bar (Workstream D).
        post.tags.forEach((tag: string) => tags.add(tag));
    });

    blogs.all.sort(sortByDate);
    blogs.spotlight.sort(sortByDate);

    // Featured = three newest posts overall.
    blogs.featured = blogs.all.slice(0, 3);
    blogs.tags = Array.from(tags).sort();

    return blogs;
};

/**
 * Build the list of Next.js dynamic routes for /blogs/[id].
 * Example: file "eve-urban-autonomy.md" → { params: { id: "eve-urban-autonomy" } }
 */
export const getBlogIds = () => {
    return listPostFilenames()
        .map((filename) => {
            const post = readBlogMeta(filename);
            if (!post) return null;
            return {
                params: {
                    id: post.id,
                },
            };
        })
        .filter((p): p is { params: { id: string } } => p !== null);
};

/**
 * Load ONE full blog post (metadata + HTML body) for the article page.
 */
export const getBlogData = async (id: string): Promise<BlogPostData> => {
    const filePath = path.join(PATH, `${id}.md`);
    const fileContents = fs.readFileSync(filePath, "utf8");
    const parsedContent = matter(fileContents);

    // Convert markdown → HTML string for dangerouslySetInnerHTML on the article page.
    const contentHtml = await remark().use(html).process(parsedContent.content);

    const post = normalizePostFields(
        id,
        parsedContent.data,
        contentHtml.toString()
    );

    if (!post) {
        throw new Error(
            `Blog post "${id}" is missing required frontmatter (at least title).`
        );
    }

    return post;
};

/**
 * Workstream E (+ reused by Spotlight related cards in Workstream C)
 * -----------------------------------------------------------------
 * Find up to `limit` posts related to `currentId`.
 *
 * Matching strategy (kept deliberately simple per PRD):
 *   1. Prefer posts that share at least one tag with the current post.
 *      Rank by number of shared tags (more overlap = more related), then by date.
 *   2. If we still need more slots, fill with the most recent other posts.
 *
 * Never returns the current post itself.
 */
export const getRelatedPosts = (
    currentId: string,
    limit = 3
): BlogPostData[] => {
    const { all } = getBlogs();
    const current = all.find((p) => p.id === currentId);

    // If the current post somehow is missing, just return newest others.
    if (!current) {
        return all.filter((p) => p.id !== currentId).slice(0, limit);
    }

    // Shared pure helper — same logic the Spotlight carousel uses on the client.
    return pickRelatedPosts(current, all, limit);
};
