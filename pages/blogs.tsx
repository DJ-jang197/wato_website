/**
 * pages/blogs.tsx — Blog listing page (`/blogs`)
 * ==============================================
 * BEGINNER NOTE:
 * This is the page you see at http://localhost:3000/blogs
 *
 * Vertical layout (PRD hierarchy, with Spotlight added in Workstream C):
 *   1. Hero          → newest post (full-screen)
 *   2. Spotlight     → carousel of posts with spotlight: true
 *   3. Featured      → newest 3 posts as cards
 *   4. Filter        → text search + tag chips
 *   5. All Blogs     → full grid (filtered)
 *
 * Data comes from getStaticProps → lib/blogsDAL.getBlogs() at BUILD time
 * (and on each request in `next dev`).
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

const Blogs = ({ allBlogsData }: BlogPageProps) => {
    // Free-text search string (Workstream D keeps this behaviour unchanged).
    const [filters, setFilters] = useState("");
    // Selected tag chips — a post must include ALL selected tags to match.
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    /** Toggle a tag in/out of the selectedTags array. */
    const toggleTag = (tag: string) => {
        setSelectedTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
        );
    };

    /**
     * Combined filter for the "All Blogs" grid:
     *   1. Text search across title / authors / date / description / tags
     *   2. AND every selected tag must be on the post
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

    return (
        <div className="bg-wato-black-vanta">
            {/* Hero uses the newest post (index 0 after date sort). */}
            <HeroBlog blog={allBlogsData.all[0]} content />

            {/*
             * Workstream C — Spotlight carousel.
             * Judgment call: placed after hero and before Featured so the
             * original Featured / Filter / All hierarchy stays intact below.
             */}
            <Spotlight
                postings={allBlogsData.spotlight}
                allPosts={allBlogsData.all}
            />

            <BlogPostings title={"Featured"} postings={allBlogsData.featured} />

            <Filter
                placeholder={"Search for a title, description, tag or author"}
                filters={filters}
                setFilters={setFilters}
                availableTags={allBlogsData.tags}
                selectedTags={selectedTags}
                onToggleTag={toggleTag}
            />

            <BlogPostings
                title={"All Blogs"}
                postings={allBlogsData.all.filter(blogFilter)}
            />
        </div>
    );
};

export async function getStaticProps() {
    const allBlogsData = getBlogs();
    return {
        props: {
            allBlogsData,
        },
    };
}

export default Blogs;
