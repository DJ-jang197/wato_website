/**
 * blogRelated.ts — shared "related posts" picker (pure function, no filesystem)
 * ============================================================================
 * BEGINNER NOTE:
 * Why a separate file? `lib/blogsDAL.ts` uses Node's `fs` module, which only
 * works on the server. The Spotlight carousel runs in the browser (client),
 * so it cannot call `getRelatedPosts()` directly. This helper is plain
 * TypeScript — both the server DAL and the client Spotlight can import it.
 *
 * Used by:
 *   - Workstream C (Spotlight related cards)
 *   - Workstream E (article page related section) via blogsDAL.getRelatedPosts
 */

import { BlogPostData } from "../types";

const sortByDate = (a: BlogPostData, b: BlogPostData) => {
    return Date.parse(String(b.date)) - Date.parse(String(a.date));
};

/**
 * Pick up to `limit` posts related to `current`.
 *
 * Strategy (PRD Workstream E — keep it simple):
 *   1. Prefer posts that share tags with `current` (more shared tags = better).
 *   2. If still short, fill with newest remaining posts.
 *   3. Never include `current` itself.
 */
export const pickRelatedPosts = (
    current: BlogPostData,
    all: BlogPostData[],
    limit = 3
): BlogPostData[] => {
    // Defensive defaults — never assume tags is defined.
    const currentTags = new Set(current.tags ?? []);
    const others = all
        .filter((p) => p.id !== current.id)
        .slice()
        .sort(sortByDate);

    const scored = others.map((post) => {
        const overlap = (post.tags ?? []).filter((t) => currentTags.has(t))
            .length;
        return { post, overlap };
    });

    const withOverlap = scored
        .filter((s) => s.overlap > 0)
        .sort((a, b) => {
            if (b.overlap !== a.overlap) return b.overlap - a.overlap;
            return sortByDate(a.post, b.post);
        })
        .map((s) => s.post);

    const fallback = scored.filter((s) => s.overlap === 0).map((s) => s.post);

    const related: BlogPostData[] = [];
    for (const post of [...withOverlap, ...fallback]) {
        if (related.length >= limit) break;
        related.push(post);
    }
    return related;
};
