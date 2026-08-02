/**
 * pages/blogs.tsx — Blog listing page (`/blogs`)
 * ==============================================
 * BEGINNER NOTE:
 * This is the page at http://localhost:3000/blogs
 *
 * Layout (top → bottom):
 *   1. Hero          → newest post
 *   2. Spotlight     → posts with spotlight: true
 *   3. Featured      → newest 3 cards
 *   4. Filter        → text search + tag chips
 *   5. All Blogs     → filtered grid
 */

import { getBlogs } from "../lib/blogsDAL";
import HeroBlog from "../components/BlogPostings/HeroBlog";
import BlogPostings from "../components/BlogPostings/BlogPostings";
import Spotlight from "../components/BlogPostings/Spotlight";
import { useState } from "react";
import Filter from "../components/Filter";
import { BlogPostData } from "../types";

interface BlogDataList {
    featured: BlogPostData[];
    spotlight: BlogPostData[];
    all: BlogPostData[];
    tags: string[];
}
interface BlogPageProps {
    allBlogsData: BlogDataList;
}

/**
 * Client component for the public blog index.
 * Search + tag filters run entirely in the browser (no extra API calls).
 */
const Blogs = ({ allBlogsData }: BlogPageProps) => {
    const [filters, setFilters] = useState("");
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    /** Toggle a tag chip on/off in the selectedTags list. */
    const toggleTag = (tag: string) => {
        setSelectedTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
        );
    };

    /**
     * Returns true when a post matches the current text query AND all
     * selected tags. Empty filters mean "match everything".
     */
    const blogFilter = (post: BlogPostData) => {
        const textMatch = `${post.title} ${post.authors.join(" ")} ${post.date
            .toString()} ${post.description} ${post.tags.join(" ")}`
            .toLowerCase()
            .includes(filters.toLowerCase());

        const tagsMatch =
            selectedTags.length === 0 ||
            selectedTags.every((tag) => post.tags.includes(tag));

        return textMatch && tagsMatch;
    };

    const posts = allBlogsData.all || [];
    const newest = posts[0];

    return (
        <div className="bg-wato-black-vanta">
            {newest ? <HeroBlog blog={newest} content /> : null}

            <Spotlight
                postings={allBlogsData.spotlight || []}
                allPosts={posts}
            />

            <BlogPostings
                title={"Featured"}
                postings={allBlogsData.featured || []}
            />

            <Filter
                placeholder={"Search for a title, description, tag or author"}
                filters={filters}
                setFilters={setFilters}
                availableTags={allBlogsData.tags || []}
                selectedTags={selectedTags}
                onToggleTag={toggleTag}
            />

            <BlogPostings
                title={"All Blogs"}
                postings={posts.filter(blogFilter)}
            />
        </div>
    );
};

/**
 * Load all blog metadata at build time (and on each request in `next dev`).
 */
export async function getStaticProps() {
    const allBlogsData = getBlogs();
    return {
        props: {
            allBlogsData,
        },
    };
}

export default Blogs;
