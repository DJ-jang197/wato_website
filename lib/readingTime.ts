/**
 * readingTime.ts — Estimate how long a blog post takes to read
 * ============================================================
 * BEGINNER NOTE:
 * We count words in the markdown body and divide by a typical adult
 * reading speed (~200 words per minute). Result is always at least 1 minute.
 *
 * Example: 450 words → ceil(450 / 200) = 3 → "3 min read"
 */

/** Average adult reading speed used for the estimate. */
const WORDS_PER_MINUTE = 200;

/**
 * Strip markdown-ish punctuation enough to get a rough word count.
 * Does not need to be perfect — this is an estimate for readers.
 */
export const countWords = (markdownBody: string): number => {
    const plain = markdownBody
        .replace(/```[\s\S]*?```/g, " ") // fenced code blocks
        .replace(/`[^`]*`/g, " ") // inline code
        .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // images
        .replace(/\[[^\]]*\]\([^)]*\)/g, " ") // links (keep nothing; count link text separately below)
        .replace(/[#>*_~-]+/g, " ") // headings / emphasis markers
        .replace(/\s+/g, " ")
        .trim();

    if (!plain) return 0;
    return plain.split(" ").filter(Boolean).length;
};

/**
 * @returns Whole number of minutes (minimum 1).
 */
export const estimateReadingMinutes = (markdownBody: string): number => {
    const words = countWords(markdownBody);
    return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
};

/**
 * Display string shown near titles, e.g. "3 min read".
 */
export const formatReadingTime = (minutes: number): string => {
    const m = Math.max(1, Math.round(minutes));
    return `${m} min read`;
};
