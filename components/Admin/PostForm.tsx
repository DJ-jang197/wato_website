/**
 * components/Admin/PostForm.tsx — Create / edit blog post form
 */

import { useState, FormEvent } from "react";
import { useRouter } from "next/router";

export interface PostFormValues {
    id: string;
    title: string;
    date: string;
    image: string;
    description: string;
    tags: string;
    authors: string;
    spotlight: boolean;
    body: string;
}

interface PostFormProps {
    mode: "create" | "edit";
    initial: PostFormValues;
}

const splitList = (raw: string): string[] =>
    raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

const PostForm = ({ mode, initial }: PostFormProps) => {
    const router = useRouter();
    const [values, setValues] = useState<PostFormValues>(initial);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const onChange = (
        key: keyof PostFormValues,
        value: string | boolean
    ) => {
        setValues((prev) => ({ ...prev, [key]: value }));
    };

    const onSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");

        const payload = {
            id: values.id,
            title: values.title,
            date: values.date,
            image: values.image,
            description: values.description,
            tags: splitList(values.tags),
            authors: splitList(values.authors),
            spotlight: values.spotlight,
            body: values.body,
        };

        const url =
            mode === "create"
                ? "/api/admin/posts"
                : `/api/admin/posts/${encodeURIComponent(values.id)}`;
        const method = mode === "create" ? "POST" : "PUT";

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Save failed");
                setSaving(false);
                return;
            }
            router.push("/admin");
        } catch {
            setError("Network error while saving.");
            setSaving(false);
        }
    };

    const fieldClass =
        "w-full rounded-md border border-wato-grey bg-wato-black-vanta px-3 py-2 text-sm text-white outline-none focus:border-wato-teal";

    return (
        <form onSubmit={onSubmit} className="flex w-full max-w-3xl flex-col gap-4">
            {error && (
                <div className="rounded-md border border-red-400 bg-red-950/40 px-3 py-2 text-sm text-red-200">
                    {error}
                </div>
            )}

            <label className="flex flex-col gap-1 text-sm text-wato-grey">
                Slug / id (filename without .md)
                <input
                    className={fieldClass}
                    value={values.id}
                    disabled={mode === "edit"}
                    onChange={(e) => onChange("id", e.target.value)}
                    placeholder="eve-urban-autonomy"
                    required
                />
            </label>

            <label className="flex flex-col gap-1 text-sm text-wato-grey">
                Title
                <input
                    className={fieldClass}
                    value={values.title}
                    onChange={(e) => onChange("title", e.target.value)}
                    required
                />
            </label>

            <label className="flex flex-col gap-1 text-sm text-wato-grey">
                Date (MMMM DD YYYY)
                <input
                    className={fieldClass}
                    value={values.date}
                    onChange={(e) => onChange("date", e.target.value)}
                    placeholder="March 12 2026"
                    required
                />
            </label>

            <label className="flex flex-col gap-1 text-sm text-wato-grey">
                Image path (under public/)
                <input
                    className={fieldClass}
                    value={values.image}
                    onChange={(e) => onChange("image", e.target.value)}
                    placeholder="/imgs/projects/eve/eve-hero.jpg"
                    required
                />
            </label>

            <label className="flex flex-col gap-1 text-sm text-wato-grey">
                Description
                <textarea
                    className={`${fieldClass} min-h-[80px]`}
                    value={values.description}
                    onChange={(e) => onChange("description", e.target.value)}
                    required
                />
            </label>

            <label className="flex flex-col gap-1 text-sm text-wato-grey">
                Tags (comma-separated)
                <input
                    className={fieldClass}
                    value={values.tags}
                    onChange={(e) => onChange("tags", e.target.value)}
                    placeholder="EVE, Perception"
                    required
                />
            </label>

            <label className="flex flex-col gap-1 text-sm text-wato-grey">
                Authors (comma-separated)
                <input
                    className={fieldClass}
                    value={values.authors}
                    onChange={(e) => onChange("authors", e.target.value)}
                    placeholder="WATonomous Autonomy Team"
                    required
                />
            </label>

            <label className="flex items-center gap-2 text-sm text-wato-grey">
                <input
                    type="checkbox"
                    checked={values.spotlight}
                    onChange={(e) => onChange("spotlight", e.target.checked)}
                />
                Spotlight on /blogs
            </label>

            <label className="flex flex-col gap-1 text-sm text-wato-grey">
                Body (Markdown)
                <textarea
                    className={`${fieldClass} min-h-[240px] font-mono`}
                    value={values.body}
                    onChange={(e) => onChange("body", e.target.value)}
                    required
                />
            </label>

            <div className="flex flex-wrap gap-3">
                <button
                    type="submit"
                    disabled={saving}
                    className="rounded-md bg-wato-teal px-4 py-2 text-sm font-medium text-black disabled:opacity-60"
                >
                    {saving ? "Saving…" : mode === "create" ? "Publish post" : "Save changes"}
                </button>
                <button
                    type="button"
                    className="rounded-md border border-wato-grey px-4 py-2 text-sm text-wato-grey"
                    onClick={() => router.push("/admin")}
                >
                    Cancel
                </button>
                {mode === "edit" && values.id && (
                    <a
                        className="rounded-md px-4 py-2 text-sm text-wato-teal underline"
                        href={`/blogs/${values.id}`}
                        target="_blank"
                        rel="noreferrer"
                    >
                        View public page
                    </a>
                )}
            </div>
        </form>
    );
};

export default PostForm;
