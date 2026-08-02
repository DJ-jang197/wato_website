/**
 * pages/blogs/preview.tsx — Fixed preview of one article (no dynamic id)
 * =====================================================================
 * Useful for layout QA at /blogs/preview without typing a slug.
 * Keep PREVIEW_POST_ID in sync with a real file under static/blogs/.
 */

import { getBlogData, getRelatedPosts } from "../../lib/blogsDAL";
import HeroBlog from "../../components/BlogPostings/HeroBlog";
import BlogPostings from "../../components/BlogPostings/BlogPostings";
import Detail from "../../components/Detail";
import BadgeList from "../../components/Badge/BadgeList";
import { BlogPostData } from "../../types";

/** Must match an existing `static/blogs/<id>.md` filename. */
const PREVIEW_POST_ID = "eve-urban-autonomy";

interface BlogPreviewPageProps {
    blogData: BlogPostData;
    relatedPosts: BlogPostData[];
}

/**
 * Same visual layout as pages/blogs/[id].tsx for the hardcoded preview post.
 */
export default function BlogPreviewPage({
    blogData,
    relatedPosts,
}: BlogPreviewPageProps) {
    return (
        <div className="overflow-x-hidden scroll-smooth">
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
 * Always loads PREVIEW_POST_ID (no URL params).
 */
export async function getStaticProps() {
    const blogData = await getBlogData(PREVIEW_POST_ID);
    const relatedPosts = getRelatedPosts(PREVIEW_POST_ID, 3);
    return {
        props: {
            blogData,
            relatedPosts,
        },
    };
}
