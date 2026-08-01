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

const MarqueeItem = ({
    idx,
    isCurrent,
    content,
    postId,
    onClick,
}: MarqueeItemProps) => {
    return (
        <div
            className={`m-2 flex h-[10rem] w-[30%] cursor-pointer items-center justify-center text-center font-bold lg:w-64 ${
                isCurrent && "text-xl text-wato-blue lg:text-3xl"
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

const Marquee = ({ posts, maskPosts, onItemClick }: MarqueeProps) => {
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

const Spotlight = ({ postings, allPosts }: SpotlightProps) => {
    const router = useRouter();
    const [currentIdx, setCurrentIdx] = useState(0);
    const [fastIdx, setFastIdx] = useState(0);
    const timer = useRef<ReturnType<typeof setInterval>>();

    const hasPosts = postings && postings.length > 0;
    const len = hasPosts ? postings.length : 1;

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

    const delay = (d: number) => {
        return new Promise((resolve) => setTimeout(resolve, d));
    };

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
            className={`flex flex-col bg-wato-blue-gloomy px-5 pb-10 sm:px-16 lg:px-44 xl:h-[80vh] xl:px-60`}
        >
            <Marquee
                posts={marqueePostings}
                maskPosts={fastPostings}
                onItemClick={navigateToPost}
            />
            <div className="spotlight grid auto-rows-min gap-x-24 gap-y-12 transition-opacity lg:grid-cols-2">
                <div className="col-start-1 col-end-2 text-6xl font-medium">
                    {post.title}
                </div>
                <div className="col-start-1 col-end-2 text-xl font-light">
                    {post.description}
                </div>
                <div className="col-start-1 col-end-2">
                    <span className="text-xl font-bold">Related</span>
                    <div className="mt-2 flex flex-wrap">
                        {related.map((relatedPost) => (
                            <Link
                                key={relatedPost.id}
                                href={`/blogs/${relatedPost.id}`}
                                className="mr-4 flex h-32 flex-col justify-between rounded-sm bg-wato-blue-water p-4 no-underline lg:w-64"
                            >
                                <div className="font-bold text-black">
                                    {relatedPost.title}
                                </div>
                                <div className="font-light text-wato-blue">
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
