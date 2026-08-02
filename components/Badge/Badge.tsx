/**
 * Badge.tsx — Single tag pill
 * ===========================
 * BEGINNER NOTE:
 * `max-w-full` + `truncate` keep a very long tag from blowing out the card
 * width on mobile. The bg-badge gradient is the existing shipped look (PRD §4.1).
 *
 * Optional `className` lets callers (e.g. Filter selection ring) override
 * margin / outline without changing the default card look.
 */

interface BadgeProps {
    content: HTMLElement | Element | any;
    /** Extra classes merged after the default pill styles. */
    className?: string;
}

const Badge = ({ content, className = "" }: BadgeProps) => {
    return (
        <div
            className={`mr-2 max-w-full truncate rounded-lg bg-badge px-2 py-1 text-xs uppercase text-white ${className}`}
        >
            {content}
        </div>
    );
};

export default Badge;
