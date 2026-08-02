/**
 * HeroBlog.tsx — Full-bleed blog hero (listing newest post or article title)
 * ========================================================================
 * `content=true` (listing): authors, description, tags, Read More CTA.
 * `content=false` (article): title + reading time only.
 */

import { BlogPostData } from "../../types";
import BadgeList from "../Badge/BadgeList";
import { FaArrowAltCircleRight } from "react-icons/fa";
import ReadingTimeLabel from "./ReadingTimeLabel";

interface HeroBlogProps {
    blog: BlogPostData;
    /** When true, show blurb + tags + Read More (listing page). */
    content: boolean;
}

/**
 * Edge-to-edge hero using the post image as a background plane.
 */
const HeroBlog = ({ blog, content }: HeroBlogProps) => {
    const minutes = blog.readingMinutes ?? 1;

    return (
        <div
            style={{ backgroundImage: `url(${blog.image})` }}
            className="h-screen w-full max-w-[100vw] overflow-hidden bg-cover bg-center"
        >
            <div className="flex h-screen w-full items-end justify-center bg-black bg-opacity-90 lg:bg-opacity-80">
                <div className="mx-auto my-20 w-full max-w-[100rem] px-4 text-white sm:my-32 sm:px-8 md:px-16 lg:w-[90vw] lg:px-0">
                    <div className="mb-2 break-words text-2xl font-black sm:mb-3 lg:text-5xl">
                        {blog.title}&nbsp;
                        <span className="text-wato-teal">{"//"}</span>
                    </div>
                    {/* Reading time sits directly under the title (all hero modes). */}
                    <div className="mb-6 sm:mb-8">
                        <ReadingTimeLabel minutes={minutes} />
                    </div>
                    {content && (
                        <>
                            <div className="text-md lg:text-medium mb-3 break-words font-medium">
                                {blog.authors[0]} • {blog.date}
                            </div>
                            <div className="text-md lg:text-medium mb-3 break-words font-medium lg:w-3/4">
                                {blog.description}
                            </div>
                            <div className="mb-3 max-w-full">
                                <BadgeList badges={blog.tags} />
                            </div>
                            <div className="mt-4 flex w-full">
                                <a
                                    className="flex cursor-pointer items-center text-lg font-medium text-wato-teal sm:text-xl"
                                    href={`/blogs/${blog.id}`}
                                >
                                    <p>Read More</p>
                                    <FaArrowAltCircleRight className="ml-3 text-2xl" />
                                </a>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HeroBlog;
