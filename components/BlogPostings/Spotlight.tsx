/**
 * Spotlight.tsx — Blog Spotlight carousel (Workstream C)
 * ======================================================
 * BEGINNER NOTE:
 * This section sits on the /blogs listing page and auto-rotates through posts
 * whose markdown frontmatter has `spotlight: true`.
 *
 * What it shows for the "current" spotlight post:
 *   - A marquee of neighbouring titles (prev / current / next)
 *   - Title + description
 *   - Up to 2 "Related" mini-cards (real posts, shared-tag logic)
 *   - A large image (desktop)
 *
 * Design constraints (PRD §4 / §4.1):
 *   - Keep existing wato-blue.gloomy / wato-blue.water colours
 *   - Do NOT add new gradients (only the existing Badge bg-badge gradient is allowed)
 *   - Motion stays subtle (fade + translate), not flashy
 */

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { BlogPostData, Fade, MarqueeDirection } from "../../types";
import { fadeElement } from "../../lib/utils";
import { pickRelatedPosts } from "../../lib/blogRelated";

/** How often (ms) the carousel advances on its own. 50000 = 50 seconds. */
const SPOTLIGHT_ROTATION_INTERVAL = 50000;

/** How many related mini-cards to show under "Related". */
const RELATED_CARD_COUNT = 2;

interface MarqueeItemProps {
    idx: number;
    isCurrent: boolean;
    content: string;
    postId: string;
    onClick(idx: number, postId: string): void;
}

/** One title cell in the spotlight marquee (clickable / keyboard accessible). */
const MarqueeItem = ({
    idx,
    isCurrent,
    content,
    postId,
    onClick,
}: MarqueeItemProps) => {
    return (
        <div
            className={`m-2 flex h-[6rem] w-[30%] min-w-0 cursor-pointer items-center justify-center overflow-hidden text-center text-xs font-bold sm:h-[10rem] sm:text-base lg:w-64 ${
                isCurrent && "text-sm text-wato-blue sm:text-xl lg:text-3xl"
            }`}
            onClick={() => onClick(idx, postId)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onClick(idx, postId);
                }
            }}
        >
            {content}
        </div>
    );
};

interface MarqueeProps {
    posts: BlogPostData[];
    /** Optional second row used by the animation mask (same structure as original). */
    maskPosts?: BlogPostData[];
    onItemClick(postId: string): void;
}

/** Horizontal prev / current / next title strip above the spotlight body. */
const Marquee = ({ posts, maskPosts, onItemClick }: MarqueeProps) => {
    /** Forward marquee clicks to the parent (navigate to that post). */
    const handleClick = (_idx: number, postId: string) => {
        onItemClick(postId);
    };

    /** Map posts into MarqueeItem elements for the visible or mask row. */
    const renderItems = (list: BlogPostData[]) =>
        list.map((post, index) => (
            <MarqueeItem
                idx={index}
                isCurrent={index === Math.floor(list.length / 2)}
                key={`${post.id}-${index}`}
                content={post.title}
                postId={post.id}
                onClick={handleClick}
            />
        ));

    return (
        <div className="mb-12 flex justify-center border-b-2 border-wato-blue">
            <div className="spotlight-container min-h-[5em] overflow-hidden">
                <div className="spotlight-mask absolute z-20 flex bg-wato-blue-gloomy opacity-0">
                    {renderItems(maskPosts ?? posts)}
                </div>
                <div className="spotlight-list flex transition-all">
                    {renderItems(posts)}
                </div>
            </div>
        </div>
    );
};

interface SpotlightProps {
    /** Posts with spotlight: true (carousel slides). */
    postings: BlogPostData[];
    /** Full post list — Related cards can match against any post, not only spotlight ones. */
    allPosts: BlogPostData[];
}

/**
 * Auto-rotating spotlight section for posts marked `spotlight: true`.
 * Returns null when there are no spotlight posts.
 */
const Spotlight = ({ postings, allPosts }: SpotlightProps) => {
    const router = useRouter();
    const [currentIdx, setCurrentIdx] = useState(0);
    const [fastIdx, setFastIdx] = useState(0);
    const timer = useRef<ReturnType<typeof setInterval>>();

    const hasPosts = postings && postings.length > 0;
    const len = hasPosts ? postings.length : 1;

    /** Advance the carousel one step (used by the auto-rotation timer). */
    const getNext = () =>
        transitionSpotlight(
            MarqueeDirection.Next,
            () => setFastIdx((idx) => idx + 1),
            () => setCurrentIdx((idx) => idx + 1)
        );

    // Hooks must run every render (even when postings is empty).
    useEffect(() => {
        if (!hasPosts) return;
        timer.current = setInterval(getNext, SPOTLIGHT_ROTATION_INTERVAL);
        return () => clearInterval(timer.current);
    }, [hasPosts, len]);

    /** Small Promise-based delay used by the transition animation. */
    const delay = (d: number) => {
        return new Promise((resolve) => setTimeout(resolve, d));
    };

    /**
     * Animate marquee slide + fade, then commit the index update.
     * Resets the auto-rotation timer after each transition.
     */
    const transitionSpotlight = async (
        direction: MarqueeDirection,
        fastFn: () => void,
        fn: () => void
    ) => {
        const elements = document.querySelectorAll(`.spotlight`);
        const list = document.querySelector(`.spotlight-list`);
        const listMask = document.querySelector(`.spotlight-mask`);

        clearInterval(timer.current);
        timer.current = setInterval(getNext, SPOTLIGHT_ROTATION_INTERVAL);

        fastFn();
        fadeElement(Fade.Out, elements);

        list!.classList.add(
            direction === MarqueeDirection.Next
                ? "-translate-x-[271.6px]"
                : "translate-x-[271.6px]"
        );

        await delay(100);
        listMask!.classList.remove("opacity-0");
        await delay(300);

        list!.classList.remove(
            direction === MarqueeDirection.Next
                ? "-translate-x-[271.6px]"
                : "translate-x-[271.6px]"
        );
        list!.classList.remove("transition-all");

        fn();
        await delay(100);

        listMask!.classList.add("opacity-0");
        fadeElement(Fade.In, elements);
        list!.classList.add("transition-all");
    };

    if (!hasPosts) {
        return null;
    }

    const post = postings.at(currentIdx % postings.length)!;
    const related = pickRelatedPosts(post, allPosts, RELATED_CARD_COUNT);

    /** Client-side navigation when a marquee title or related card is chosen. */
    const navigateToPost = (postId: string) => {
        router.push(`/blogs/${postId}`);
    };

    const marqueePostings = [
        postings.at((currentIdx - 1 + postings.length) % postings.length)!,
        postings.at(currentIdx % postings.length)!,
        postings.at((currentIdx + 1) % postings.length)!,
    ];

    const fastPostings = [
        postings.at((fastIdx - 1 + postings.length) % postings.length)!,
        postings.at(fastIdx % postings.length)!,
        postings.at((fastIdx + 1) % postings.length)!,
    ];

    return (
        <div
            className={`flex w-full flex-col overflow-x-hidden bg-wato-blue-gloomy px-4 pb-10 sm:px-16 lg:px-44 xl:h-[80vh] xl:px-60`}
        >
            <Marquee
                posts={marqueePostings}
                maskPosts={fastPostings}
                onItemClick={navigateToPost}
            />
            <div className="spotlight grid w-full min-w-0 auto-rows-min gap-x-24 gap-y-8 transition-opacity sm:gap-y-12 lg:grid-cols-2">
                {/* Title scales down on phones so it stays inside the section */}
                <div className="col-start-1 col-end-2 min-w-0">
                    <div className="break-words text-3xl font-medium sm:text-5xl lg:text-6xl">
                        {post.title}
                    </div>
                    {typeof post.readingMinutes === "number" && (
                        <div className="mt-2 text-sm font-medium text-wato-blue">
                            {post.readingMinutes} min read
                        </div>
                    )}
                </div>
                <div className="col-start-1 col-end-2 break-words text-base font-light sm:text-xl">
                    {post.description}
                </div>
                <div className="col-start-1 col-end-2 min-w-0">
                    <span className="text-lg font-bold sm:text-xl">Related</span>
                    {/*
                     * Stack related mini-cards on mobile (flex-col),
                     * side-by-side on larger screens. min-w-0 + break-words
                     * keep long titles inside each card.
                     */}
                    <div className="mt-2 flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap">
                        {related.map((relatedPost) => (
                            <Link
                                key={relatedPost.id}
                                href={`/blogs/${relatedPost.id}`}
                                className="flex min-h-[7rem] w-full min-w-0 flex-col justify-between overflow-hidden rounded-sm bg-wato-blue-water p-4 no-underline sm:mr-4 sm:h-32 sm:w-64 sm:max-w-full"
                            >
                                <div className="line-clamp-3 break-words font-bold text-black">
                                    {relatedPost.title}
                                </div>
                                <div className="mt-2 font-light text-wato-blue">
                                    Read more →
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
                <div className="relative col-start-2 col-end-3 row-start-1 row-end-4 max-lg:hidden">
                    <Image
                        fill
                        alt={"spotlight image"}
                        src={post.image}
                        className="object-cover"
                    />
                </div>
            </div>
        </div>
    );
};

export default Spotlight;
