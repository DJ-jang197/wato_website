/**
 * Filter.tsx — Search bar (+ optional tag chips) for /blogs
 * ========================================================
 * BEGINNER NOTE:
 * Originally this component was ONLY a text search box + Clear button.
 * Workstream D extends it (without inventing a new UI pattern) so users can
 * also click tag chips to narrow the "All Blogs" grid.
 *
 * How filtering works on the parent page (pages/blogs.tsx):
 *   - Text search still filters by title/author/date/description/tags substring
 *   - Selected tags further require the post to include EVERY selected tag
 *   - Clear resets BOTH the text and the selected tags
 *
 * Visual rule (PRD §4.1):
 *   Tag chips reuse Badge styling (bg-badge gradient) — the only allowed gradient.
 */

import Button from "./Button";
import Badge from "./Badge/Badge";

interface FilterProps {
    placeholder: string;
    /** Current text in the search box. */
    filters?: string | string[];
    setFilters: (value: string) => void;
    /**
     * Workstream D — optional tag filter UI.
     * When omitted, the component behaves exactly like before (text search only).
     */
    availableTags?: string[];
    selectedTags?: string[];
    /** Called when the user clicks a tag chip (parent toggles selection). */
    onToggleTag?: (tag: string) => void;
}

/**
 * Search box (+ optional tag chips) controlling the "All Blogs" grid filter.
 */
const Filter = ({
    placeholder,
    filters,
    setFilters,
    availableTags = [],
    selectedTags = [],
    onToggleTag,
}: FilterProps) => {
    const hasTagUi = availableTags.length > 0 && typeof onToggleTag === "function";

    /** Reset text query and deselect every active tag chip. */
    const handleClear = () => {
        setFilters("");
        // Clearing also deselects every tag (parent listens by receiving empty via toggles).
        if (hasTagUi && selectedTags.length > 0) {
            // Toggle each selected tag off one by one (keeps parent as source of truth).
            selectedTags.forEach((tag) => onToggleTag!(tag));
        }
    };

    return (
        <div className="flex w-full flex-col items-center justify-center overflow-x-hidden bg-black py-10 sm:py-16">
            <div className="flex w-full max-w-[100rem] flex-col items-stretch gap-3 px-4 sm:flex-row sm:items-center sm:gap-0 sm:px-8 md:px-16 lg:w-[90vw] lg:px-0">
                <input
                    className="w-full min-w-0 rounded-md border-l-[20px] border-white bg-search bg-left bg-no-repeat py-3 pl-10 text-sm outline-none sm:mr-5"
                    type="text"
                    id="filter"
                    value={filters}
                    onChange={(e) => setFilters(e.target.value)}
                    placeholder={placeholder}
                    style={{ backgroundSize: "25px" }}
                />
                <div className="shrink-0 self-end sm:self-auto">
                    <Button
                        text="Clear"
                        color="bg-wato-teal text-black"
                        onClick={handleClear}
                    />
                </div>
            </div>

            {/*
             * Tag filter chips (Workstream D).
             * Click a chip to toggle it. Selected chips get a teal outline so
             * beginners can see which filters are active — using solid brand
             * tokens only (no new gradients).
             */}
            {hasTagUi && (
                <div className="mt-6 flex w-full max-w-[100rem] flex-wrap gap-2 px-4 sm:px-8 md:px-16 lg:w-[90vw] lg:px-0">
                    <span className="mr-2 w-full self-center text-xs font-bold uppercase text-wato-teal sm:w-auto">
                        Filter by tag
                    </span>
                    {availableTags.map((tag) => {
                        const isSelected = selectedTags.includes(tag);
                        return (
                            <button
                                key={tag}
                                type="button"
                                onClick={() => onToggleTag!(tag)}
                                className={`max-w-full cursor-pointer border-0 bg-transparent p-0 ${
                                    isSelected
                                        ? "rounded-lg ring-2 ring-wato-teal"
                                        : "opacity-80 hover:opacity-100"
                                }`}
                                aria-pressed={isSelected}
                                title={
                                    isSelected
                                        ? `Remove filter: ${tag}`
                                        : `Filter by: ${tag}`
                                }
                            >
                                {/* Reuse exact Badge look (existing bg-badge gradient). */}
                                <Badge content={tag} />
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Filter;
