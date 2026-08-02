/**
 * Spotlight.tsx — Blog Spotlight carousel (Workstream C)
 * ======================================================
 * BEGINNER NOTE:
 * This section sits on the /blogs listing page under the Featured hero.
 *
 * How navigation works:
 *   - Auto-advances every 50 seconds through posts with `spotlight: true`
 *   - Left / right arrows manually step prev / next (resets the auto timer)
 *   - Clicking a marquee title opens that blog article
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
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
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
    onPrev(): void;
    onNext(): void;
}

/**
 * Horizontal prev / current / next title strip with side arrows.
 * The blue underline + fade mask stays; arrows step the carousel.
 */
const Marquee = ({
    posts,
    maskPosts,
    onItemClick,
    onPrev,
    onNext,
}: MarqueeProps) => {
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
        <div className="mb-12 flex w-full items-center justify-center gap-1 border-b-2 border-wato-blue sm:gap-3">
            <button
                type="button"
                aria-label="Previous spotlight post"
                onClick={onPrev}
                className="shrink-0 rounded-full p-2 text-wato-blue transition-opacity hover:opacity-80"
            >
                <FaChevronLeft className="text-xl sm:text-2xl" />
            </button>
            <div className="spotlight-container min-h-[5em] min-w-0 flex-1 overflow-hidden">
                <div className="spotlight-mask absolute z-20 flex bg-wato-blue-gloomy opacity-0">
                    {renderItems(maskPosts ?? posts)}
                </div>
                <div className="spotlight-list flex transition-all">
                    {renderItems(posts)}
                </div>
            </div>
            <button
                type="button"
                aria-label="Next spotlight post"
                onClick={onNext}
                className="shrink-0 rounded-full p-2 text-wato-blue transition-opacity hover:opacity-80"
            >
                <FaChevronRight className="text-xl sm:text-2xl" />
            </button>
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
    const transitioning = useRef(false);

    const hasPosts = postings && postings.length > 0;
    const len = hasPosts ? postings.length : 1;

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
        if (transitioning.current) return;
        transitioning.current = true;

        const elements = document.querySelectorAll(`.spotlight`);
        const list = document.querySelector(`.spotlight-list`);
        const listMask = document.querySelector(`.spotlight-mask`);

        clearInterval(timer.current);
        timer.current = setInterval(getNext, SPOTLIGHT_ROTATION_INTERVAL);

        try {
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
        } finally {
            transitioning.current = false;
        }
    };

    /** Advance the carousel one step (auto-rotation + next arrow). */
    const getNext = () =>
        transitionSpotlight(
            MarqueeDirection.Next,
            () => setFastIdx((idx) => idx + 1),
            () => setCurrentIdx((idx) => idx + 1)
        );

    /** Step the carousel backward (previous arrow). */
    const getPrev = () =>
        transitionSpotlight(
            MarqueeDirection.Previous,
            () => setFastIdx((idx) => idx - 1),
            () => setCurrentIdx((idx) => idx - 1)
        );

    // Hooks must run every render (even when postings is empty).
    useEffect(() => {
        if (!hasPosts) return;
        timer.current = setInterval(getNext, SPOTLIGHT_ROTATION_INTERVAL);
        return () => clearInterval(timer.current);
    }, [hasPosts, len]);

    if (!hasPosts) {
        return null;
    }

    const post = postings.at(
        ((currentIdx % postings.length) + postings.length) % postings.length
    )!;
    const related = pickRelatedPosts(post, allPosts, RELATED_CARD_COUNT);

    /** Client-side navigation when a marquee title or related card is chosen. */
    const navigateToPost = (postId: string) => {
        router.push(`/blogs/${postId}`);
    };

    const safeIdx = (idx: number) =>
        ((idx % postings.length) + postings.length) % postings.length;

    const marqueePostings = [
        postings.at(safeIdx(currentIdx - 1))!,
        postings.at(safeIdx(currentIdx))!,
        postings.at(safeIdx(currentIdx + 1))!,
    ];

    const fastPostings = [
        postings.at(safeIdx(fastIdx - 1))!,
        postings.at(safeIdx(fastIdx))!,
        postings.at(safeIdx(fastIdx + 1))!,
    ];

    return (
        <div
            className={`flex w-full flex-col overflow-x-hidden bg-wato-blue-gloomy px-4 pb-10 sm:px-16 lg:px-44 xl:h-[80vh] xl:px-60`}
        >
            <Marquee
                posts={marqueePostings}
                maskPosts={fastPostings}
                onItemClick={navigateToPost}
                onPrev={getPrev}
                onNext={getNext}
            />
            <div className="spotlight grid w-full min-w-0 auto-rows-min gap-x-24 gap-y-8 transition-opacity sm:gap-y-12 lg:grid-cols-2">
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
