/**
 * Detail.tsx — Metadata row (PUBLISHED / WRITTEN BY / TAGS)
 * =========================================================
 * On phones, stack label above value so long author lists / tag rows
 * stay inside the page instead of forcing horizontal scroll.
 */

interface DetailProps {
    title: string;
    children: React.ReactNode | any;
}

const Detail = ({ title, children }: DetailProps) => {
    return (
        <div
            className={`flex flex-col gap-2 bg-wato-black-vanta px-4 py-5 sm:flex-row sm:gap-0 sm:px-0 sm:pl-12 lg:pl-36`}
        >
            <div className="shrink-0 font-bold uppercase text-wato-teal sm:w-48">
                {title}
            </div>
            <div className="min-w-0 max-w-full break-words text-wato-grey">
                {children}
            </div>
        </div>
    );
};

export default Detail;
