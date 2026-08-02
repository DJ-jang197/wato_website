/**
 * pages/admin/posts/new.tsx — Create a new markdown blog post
 */

import { GetServerSideProps } from "next";
import { getAuthedAdmin } from "../../../lib/admin/requireAuth";
import PostForm from "../../../components/Admin/PostForm";

export default function AdminNewPostPage() {
    return (
        <div className="min-h-screen bg-wato-black-vanta px-4 pb-20 pt-28 text-white sm:px-8">
            <div className="mx-auto w-full max-w-3xl">
                <h1 className="mb-6 text-3xl font-bold">
                    New post <span className="text-wato-teal">{"//"}</span>
                </h1>
                <PostForm
                    mode="create"
                    initial={{
                        id: "",
                        title: "",
                        date: "",
                        image: "/imgs/blog-01.png",
                        description: "",
                        tags: "",
                        authors: "",
                        spotlight: false,
                        body: "# New post\n\nWrite your markdown here.\n",
                    }}
                />
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
    return { props: {} };
};
