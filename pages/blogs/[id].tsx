/**
 * pages/blogs/[id].tsx — Individual blog article (`/blogs/<slug>`)
 * ================================================================
 * BEGINNER NOTE:
 * Square brackets mean a DYNAMIC route. The URL segment after /blogs/
 * becomes `params.id` and maps to `static/blogs/<id>.md`.
 *
 * Page order:
 *   Hero → published/written-by → article HTML → tags → related posts
 */

import { getBlogData, getBlogIds, getRelatedPosts } from "../../lib/blogsDAL";
import HeroBlog from "../../components/BlogPostings/HeroBlog";
import BlogPostings from "../../components/BlogPostings/BlogPostings";
import Detail from "../../components/Detail";
import BadgeList from "../../components/Badge/BadgeList";
import { BlogPostData, StaticProps } from "../../types";

interface BlogPageProps {
    blogData: BlogPostData;
    /** Up to 3 related posts (shared tags, else newest). */
    relatedPosts: BlogPostData[];
}

/**
 * Renders one article page. `blogData` and `relatedPosts` come from
 * getStaticProps at build time (SSG).
 */
export default function BlogPage({ blogData, relatedPosts }: BlogPageProps) {
    return (
        <div className="overflow-x-hidden scroll-smooth">
            {/* content={false}: title + reading time only (no Read More CTA). */}
            <HeroBlog blog={blogData} content={false} />

            <Detail title="published">{blogData.date}</Detail>
            <Detail title="written by">{blogData.authors.join(", ")}</Detail>

            <article className="prose prose-invert flex w-full max-w-none justify-center overflow-x-hidden bg-wato-black px-4 py-8 sm:px-10 sm:py-10">
                <div
                    className="w-full min-w-0 break-words md:w-[45rem] lg:w-[50rem] xl:w-[75rem]"
                    dangerouslySetInnerHTML={{ __html: blogData.contentHtml }}
                />
            </article>

            <Detail title="tags">
                <BadgeList badges={blogData.tags} />
            </Detail>

            {relatedPosts.length > 0 && (
                <BlogPostings title={"Related Posts"} postings={relatedPosts} />
            )}
        </div>
    );
}

/**
 * Pre-build one HTML page per markdown file in static/blogs/.
 * fallback:false → unknown ids show the site 404 page.
 */
export async function getStaticPaths() {
    const paths = getBlogIds();
    return {
        paths,
        fallback: false,
    };
}

/**
 * Load article HTML + related posts for a single id.
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
