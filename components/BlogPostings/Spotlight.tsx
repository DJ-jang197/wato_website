/**
 * Spotlight.tsx — Blog Spotlight carousel (Workstream C)
 * ======================================================
 * Under the Featured hero on /blogs.
 *
 * Navigation:
 *   - Auto-advances every 50s through `spotlight: true` posts
 *   - Left / right arrows step prev / next (resets the timer)
 *   - Clicking a marquee title opens that article
 *
 * Transitions keep the marquee strip and the post body in sync:
 * a short shared fade/slide (~320ms total) instead of a long blank gap.
 */

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { BlogPostData, MarqueeDirection } from "../../types";
import { pickRelatedPosts } from "../../lib/blogRelated";

/** Auto-advance interval. */
const SPOTLIGHT_ROTATION_INTERVAL = 50000;

/** Shared fade duration for bar + body (ms). */
const FADE_MS = 160;

/** How many related mini-cards under "Related". */
const RELATED_CARD_COUNT = 2;

interface MarqueeItemProps {
    idx: number;
    isCurrent: boolean;
    content: string;
    postId: string;
    onClick(idx: number, postId: string): void;
}

/** One title cell in the spotlight marquee. */
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
                isCurrent ? "text-sm text-wato-blue sm:text-xl lg:text-3xl" : ""
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
    slideClass: string;
    onItemClick(postId: string): void;
    onPrev(): void;
    onNext(): void;
}

/** Title strip + fade mask + side arrows. */
const Marquee = ({
    posts,
    slideClass,
    onItemClick,
    onPrev,
    onNext,
}: MarqueeProps) => {
    const handleClick = (_idx: number, postId: string) => {
        onItemClick(postId);
    };

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
                <div
                    className={`spotlight-list flex transition-transform duration-150 ease-out ${slideClass}`}
                >
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
    postings: BlogPostData[];
    allPosts: BlogPostData[];
}

const Spotlight = ({ postings, allPosts }: SpotlightProps) => {
    const router = useRouter();
    const [currentIdx, setCurrentIdx] = useState(0);
    /** Soft fade for body + marquee emphasis (true = fully visible). */
    const [visible, setVisible] = useState(true);
    /** Temporary slide offset class for the marquee strip. */
    const [slideClass, setSlideClass] = useState("");
    const timer = useRef<ReturnType<typeof setInterval>>();
    const transitioning = useRef(false);

    const hasPosts = postings && postings.length > 0;
    const len = hasPosts ? postings.length : 1;

    const delay = (d: number) =>
        new Promise<void>((resolve) => setTimeout(resolve, d));

    const safeIdx = (idx: number) =>
        ((idx % postings.length) + postings.length) % postings.length;

    const resetTimer = () => {
        clearInterval(timer.current);
        timer.current = setInterval(() => {
            void step(MarqueeDirection.Next);
        }, SPOTLIGHT_ROTATION_INTERVAL);
    };

    /**
     * Fade bar + body together, swap the post, fade back in.
     * Body dips to low opacity (not fully blank) so the section stays alive.
     */
    const step = async (direction: MarqueeDirection) => {
        if (!hasPosts || transitioning.current) return;
        transitioning.current = true;
        resetTimer();

        const delta = direction === MarqueeDirection.Next ? 1 : -1;
        setSlideClass(
            direction === MarqueeDirection.Next
                ? "-translate-x-8"
                : "translate-x-8"
        );
        setVisible(false);

        await delay(FADE_MS);

        setCurrentIdx((idx) => idx + delta);
        setSlideClass("");

        // Let React paint the new post while still faded, then fade in.
        await delay(16);
        setVisible(true);

        await delay(FADE_MS);
        transitioning.current = false;
    };

    useEffect(() => {
        if (!hasPosts) return;
        resetTimer();
        return () => clearInterval(timer.current);
    }, [hasPosts, len]);

    // Preload neighbouring images so arrow clicks do not wait on network.
    useEffect(() => {
        if (!hasPosts) return;
        [safeIdx(currentIdx - 1), safeIdx(currentIdx + 1)].forEach((i) => {
            const src = postings[i]?.image;
            if (!src) return;
            const img = new window.Image();
            img.src = src;
        });
    }, [currentIdx, hasPosts, postings]);

    if (!hasPosts) {
        return null;
    }

    const post = postings.at(safeIdx(currentIdx))!;
    const related = pickRelatedPosts(post, allPosts, RELATED_CARD_COUNT);

    const navigateToPost = (postId: string) => {
        router.push(`/blogs/${postId}`);
    };

    const marqueePostings = [
        postings.at(safeIdx(currentIdx - 1))!,
        postings.at(safeIdx(currentIdx))!,
        postings.at(safeIdx(currentIdx + 1))!,
    ];

    return (
        <div className="flex w-full flex-col overflow-x-hidden bg-wato-blue-gloomy px-4 pb-10 sm:px-16 lg:px-44 xl:h-[80vh] xl:px-60">
            <div
                className={`transition-opacity duration-150 ease-out ${
                    visible ? "opacity-100" : "opacity-40"
                }`}
            >
                <Marquee
                    posts={marqueePostings}
                    slideClass={slideClass}
                    onItemClick={navigateToPost}
                    onPrev={() => void step(MarqueeDirection.Previous)}
                    onNext={() => void step(MarqueeDirection.Next)}
                />
            </div>

            <div
                className={`spotlight grid w-full min-w-0 auto-rows-min gap-x-24 gap-y-8 transition-opacity duration-150 ease-out sm:gap-y-12 lg:grid-cols-2 ${
                    visible ? "opacity-100" : "opacity-25"
                }`}
            >
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
                        alt={post.title}
                        src={post.image}
                        className="object-cover transition-opacity duration-150 ease-out"
                        sizes="(max-width: 1024px) 0px, 40vw"
                        priority={currentIdx === 0}
                    />
                </div>
            </div>
        </div>
    );
};

export default Spotlight;
