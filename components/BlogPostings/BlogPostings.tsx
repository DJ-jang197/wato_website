/**
 * BlogPostings.tsx — Section title + responsive card grid
 * =======================================================
 * Used for Featured, All Blogs, and Related Posts.
 *
 * Mobile notes:
 * - Avoid `w-screen` (100vw can cause horizontal scroll with scrollbars).
 * - Section title scales down on small phones.
 * - Grid cells get min-w-0 so Post cards can shrink correctly.
 */

import { BlogPostData } from "../../types";
import Post from "./Post";

interface BlogPostingsProps {
    title: string;
    postings: BlogPostData[];
}

/**
 * Renders a titled section of blog cards in a responsive grid.
 * Empty `postings` still shows the section title (caller may hide instead).
 */
const BlogPostings = ({ title, postings }: BlogPostingsProps) => {
    return (
        <div className="flex w-full flex-col items-center overflow-x-hidden bg-wato-black-vanta py-10 sm:py-16">
            <div className="max-w-full px-4 py-6 text-3xl font-bold text-white max-lg:text-center sm:py-8 sm:text-4xl lg:text-5xl">
                {title}
            </div>
            <div className="flex w-full max-w-[100rem] justify-center px-2 sm:px-0 md:w-[45rem] lg:w-[50rem] xl:w-[75rem]">
                <div className="grid w-full grid-cols-1 gap-4 p-4 sm:gap-6 sm:p-8 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                    {postings.map((x) => {
                        return (
                            <div key={x.id} className="min-w-0">
                                <Post data={x} />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default BlogPostings;
