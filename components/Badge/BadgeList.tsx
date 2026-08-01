/**
 * BadgeList.tsx — Horizontal (wrapping) row of tag pills
 * ======================================================
 * BEGINNER NOTE:
 * On phones, many tags in one row used to overflow the card.
 * `flex-wrap` lets tags move to the next line; `min-w-0` / `max-w-full`
 * keep the row from forcing the parent wider than the screen.
 *
 * Visual: still uses the existing Badge component (bg-badge gradient only).
 */

import Badge from "./Badge";

interface BadgeListProps {
    badges: string[];
}

const BadgeList = ({ badges }: BadgeListProps) => {
    return (
        <div className="flex max-w-full min-w-0 flex-wrap gap-y-2 overflow-hidden">
            {badges.map((text: string, idx: number) => {
                return <Badge key={idx} content={text} />;
            })}
        </div>
    );
};

export default BadgeList;
