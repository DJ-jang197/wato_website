/**
 * Post.tsx — Single blog card (Featured, All Blogs, Related Posts)
 * ================================================================
 * BEGINNER NOTE:
 * This card must stay inside its grid cell on phones. Long titles, descriptions,
 * and tag rows used to spill out because tags were `position: absolute` without
 * a width limit. We now use a normal flex column so content wraps inside the card.
 *
 * Design stays the same: dark card, teal `//`, badge pills, teal hover glow.
 */

import Link from "next/link";
import BadgeList from "../Badge/BadgeList";
import Image from "next/image";
import { BlogPostData } from "../../types";
import ReadingTimeLabel from "./ReadingTimeLabel";

interface PostProps {
    data: BlogPostData;
}

/**
 * One clickable blog card linking to `/blogs/<id>`.
 * Layout is mobile-safe (min-w-0, wrap, no absolute tags).
 */
const Post = ({ data }: PostProps) => {
    const minutes = data.readingMinutes ?? 1;

    return (
        /*
         * min-w-0 + overflow-hidden: critical in CSS grids on mobile.
         * Without min-w-0, long unbroken text can force the grid cell wider
         * than the screen ("out of the container").
         */
        <div className="relative mb-2 flex w-full min-w-0 flex-col overflow-hidden rounded-xl bg-wato-black transition-all duration-300 hover:shadow-NoOffset hover:shadow-wato-teal">
            <Link
                href={`/blogs/${data.id}`}
                className="flex w-full min-w-0 flex-col p-5 text-white sm:p-8"
            >
                <div className="relative mb-5 h-40 w-full sm:h-48">
                    <Image
                        alt={"post image"}
                        src={data.image}
                        fill
                        className="rounded-sm object-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                    />
                </div>

                {/* break-words keeps long titles inside the card on narrow screens */}
                <div className="mb-1 break-words text-xl font-medium sm:text-2xl">
                    {data.title}&nbsp;
                    <span className="text-wato-teal">{"//"}</span>
                </div>

                {/* Reading time directly under the card title */}
                <div className="mb-2">
                    <ReadingTimeLabel minutes={minutes} />
                </div>

                <div className="mb-3 break-words text-sm sm:mb-5 sm:text-base">
                    <span className="font-bold">{data.authors[0]}</span> •{" "}
                    <span>{data.date}</span>
                </div>

                {/*
                 * line-clamp-4: show a few lines of the blurb, then ellipsis.
                 * Avoids giant cards when descriptions are long on mobile.
                 */}
                <div className="mb-4 line-clamp-4 break-words text-sm font-light sm:mb-6">
                    {data.description}
                </div>

                {/*
                 * Tags sit in normal document flow (not absolute), so they cannot
                 * paint outside the padded card area.
                 */}
                <div className="mt-auto w-full min-w-0 max-w-full">
                    <BadgeList badges={data.tags} />
                </div>
            </Link>
        </div>
    );
};

export default Post;
