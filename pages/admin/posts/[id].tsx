/**
 * pages/admin/posts/[id].tsx — Edit an existing post
 */

import { GetServerSideProps } from "next";
import { getAuthedAdmin } from "../../../lib/admin/requireAuth";
import { canAccessPost, readPostForEdit } from "../../../lib/admin/posts";
import PostForm, { PostFormValues } from "../../../components/Admin/PostForm";

interface EditPageProps {
    initial: PostFormValues;
}

export default function AdminEditPostPage({ initial }: EditPageProps) {
    return (
        <div className="min-h-screen bg-wato-black-vanta px-4 pb-20 pt-28 text-white sm:px-8">
            <div className="mx-auto w-full max-w-3xl">
                <h1 className="mb-6 text-3xl font-bold">
                    Edit post <span className="text-wato-teal">{"//"}</span>
                </h1>
                <PostForm mode="edit" initial={initial} />
            </div>
        </div>
    );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
    const user = await getAuthedAdmin(ctx.req, ctx.res);
    if (!user) {
        return {
            redirect: { destination: "/admin/login", permanent: false },
        };
    }

    const id = String(ctx.params?.id || "");
    if (!canAccessPost(user, id, "read")) {
        return { notFound: true };
    }

    const post = await readPostForEdit(id);
    if (!post) {
        return { notFound: true };
    }

    const initial: PostFormValues = {
        id: post.meta.id,
        title: post.meta.title,
        date: String(post.meta.date),
        image: post.meta.image,
        description: post.meta.description,
        tags: post.meta.tags.join(", "),
        authors: post.meta.authors.join(", "),
        spotlight: Boolean(post.meta.spotlight),
        body: post.body,
    };

    return { props: { initial } };
};
