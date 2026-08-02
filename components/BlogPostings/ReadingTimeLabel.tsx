/**
 * ReadingTimeLabel.tsx — Small "N min read" label near blog titles
 * ===============================================================
 * Uses existing grey/teal text tokens only (no new colors or gradients).
 */

import { formatReadingTime } from "../../lib/readingTime";

interface ReadingTimeLabelProps {
    /** Estimated minutes from blogsDAL / readingTime helper. */
    minutes: number;
    className?: string;
}

/** Displays estimated reading time next to titles (e.g. "3 min read"). */
const ReadingTimeLabel = ({
    minutes,
    className = "",
}: ReadingTimeLabelProps) => {
    return (
        <span
            className={`whitespace-nowrap text-sm font-medium text-wato-grey ${className}`}
        >
            {formatReadingTime(minutes)}
        </span>
    );
};

export default ReadingTimeLabel;
