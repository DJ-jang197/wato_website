/**
 * pages/blogs/[id].tsx — Individual blog article (`/blogs/some-post-id`)
 * =====================================================================
 * BEGINNER NOTE:
 * The square brackets in the filename mean this is a DYNAMIC route.
 * Whatever is in the URL after /blogs/ becomes `params.id`.
 * Example: /blogs/eve-urban-autonomy → params.id === "eve-urban-autonomy"
 *          which loads static/blogs/eve-urban-autonomy.md
 *
 * Page layout (PRD hierarchy + Workstream E):
 *   1. Hero (title only)
 *   2. Published / Written by metadata rows
 *   3. Article HTML body
 *   4. Tags
 *   5. Related posts (up to 3 Post cards)
 */

import { getBlogData, getBlogIds, getRelatedPosts } from "../../lib/blogsDAL";
import HeroBlog from "../../components/BlogPostings/HeroBlog";
import BlogPostings from "../../components/BlogPostings/BlogPostings";
import Detail from "../../components/Detail";
import BadgeList from "../../components/Badge/BadgeList";
import { BlogPostData, StaticProps } from "../../types";

interface BlogPageProps {
    blogData: BlogPostData;
    /** Workstream E — related posts for the bottom section. */
    relatedPosts: BlogPostData[];
}

export default function BlogPage({ blogData, relatedPosts }: BlogPageProps) {
    return (
        <div className="overflow-x-hidden scroll-smooth">
            {/* content={false} → hero shows title + image only (no Read More CTA). */}
            <HeroBlog blog={blogData} content={false} />

            <Detail title="published">{blogData.date}</Detail>
            <Detail title="written by">{blogData.authors.join(", ")}</Detail>

            <article className="prose prose-invert flex w-screen max-w-none justify-center bg-wato-black px-10 py-10">
                <div
                    className="w-screen md:w-[45rem] lg:w-[50rem] xl:w-[75rem]"
                    dangerouslySetInnerHTML={{ __html: blogData.contentHtml }}
                />
            </article>

            <Detail title="tags">
                <BadgeList badges={blogData.tags} />
            </Detail>

            {/*
             * Workstream E — Related posts.
             * Reuses BlogPostings + Post cards so visuals match the listing page.
             */}
            {relatedPosts.length > 0 && (
                <BlogPostings title={"Related Posts"} postings={relatedPosts} />
            )}
        </div>
    );
}

/**
 * Tell Next.js which blog URLs to pre-build.
 * One path per markdown file in static/blogs/.
 */
export async function getStaticPaths() {
    const paths = getBlogIds();
    return {
        paths,
        // fallback: false → unknown ids show the 404 page
        fallback: false,
    };
}

/**
 * Load the article + related posts for one id at build time.
 */
export async function getStaticProps({ params }: StaticProps) {
    const blogData = await getBlogData(params.id);
    const relatedPosts = getRelatedPosts(params.id, 3);
    return {
        props: {
            blogData,
            relatedPosts,
        },
    };
}
