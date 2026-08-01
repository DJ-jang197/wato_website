/**
 * pages/blogs/preview.tsx — Local visual preview of an article page
 * =================================================================
 * BEGINNER NOTE:
 * This is a FIXED url (`/blogs/preview`) that always loads one real post
 * so you can check the article layout without typing a dynamic id.
 *
 * It intentionally mirrors pages/blogs/[id].tsx (same components / order).
 * Update the hardcoded id below if you rename or remove that markdown file.
 */

import { getBlogData, getRelatedPosts } from "../../lib/blogsDAL";
import HeroBlog from "../../components/BlogPostings/HeroBlog";
import BlogPostings from "../../components/BlogPostings/BlogPostings";
import Detail from "../../components/Detail";
import BadgeList from "../../components/Badge/BadgeList";
import { BlogPostData } from "../../types";

/** Which markdown post to preview. Must match a file in static/blogs/. */
const PREVIEW_POST_ID = "eve-urban-autonomy";

interface BlogPreviewPageProps {
    blogData: BlogPostData;
    relatedPosts: BlogPostData[];
}

export default function BlogPreviewPage({
    blogData,
    relatedPosts,
}: BlogPreviewPageProps) {
    return (
        <div className="overflow-x-hidden scroll-smooth">
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
            {relatedPosts.length > 0 && (
                <BlogPostings title={"Related Posts"} postings={relatedPosts} />
            )}
        </div>
    );
}

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
