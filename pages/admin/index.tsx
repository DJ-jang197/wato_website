/**
 * pages/admin/index.tsx — Author dashboard (list posts + user spreadsheet)
 */

import Link from "next/link";
import { GetServerSideProps } from "next";
import { getAuthedAdmin, requireAdminRole } from "../../lib/admin/requireAuth";
import { listAdminPosts, canAccessPost } from "../../lib/admin/posts";
import { loadAllUsers } from "../../lib/admin/users";
import { signOut } from "next-auth/react";
import { BlogPostData } from "../../types";

interface AdminHomeProps {
    user: { email: string; name: string; role: string };
    posts: BlogPostData[];
    /** Full allowlist is admin-only (authors see an empty list). */
    allowlist: { email: string; name: string; role: string; active: boolean }[];
}

export default function AdminHome({ user, posts, allowlist }: AdminHomeProps) {
    return (
        <div className="min-h-screen bg-wato-black-vanta px-4 pb-20 pt-28 text-white sm:px-8">
            <div className="mx-auto w-full max-w-5xl">
                <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">
                            Blog admin <span className="text-wato-teal">{"//"}</span>
                        </h1>
                        <p className="mt-2 text-sm text-wato-grey">
                            Signed in as <span className="text-white">{user.name}</span>{" "}
                            ({user.email}) · role: {user.role}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Link
                            href="/admin/posts/new"
                            className="rounded-md bg-wato-teal px-4 py-2 text-sm font-medium text-black no-underline"
                        >
                            New post
                        </Link>
                        <button
                            type="button"
                            onClick={() => signOut({ callbackUrl: "/" })}
                            className="rounded-md border border-wato-grey px-4 py-2 text-sm text-wato-grey"
                        >
                            Sign out
                        </button>
                    </div>
                </div>

                <h2 className="mb-3 text-xl font-semibold">Posts</h2>
                <div className="mb-10 overflow-x-auto rounded-xl bg-wato-black">
                    <table className="w-full min-w-[640px] text-left text-sm">
                        <thead className="border-b border-wato-grey/30 text-wato-teal">
                            <tr>
                                <th className="px-4 py-3">Title</th>
                                <th className="px-4 py-3">Id</th>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Spotlight</th>
                                <th className="px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {posts.map((p) => (
                                <tr
                                    key={p.id}
                                    className="border-b border-wato-grey/20"
                                >
                                    <td className="px-4 py-3">{p.title}</td>
                                    <td className="px-4 py-3 font-mono text-xs text-wato-grey">
                                        {p.id}
                                    </td>
                                    <td className="px-4 py-3">{String(p.date)}</td>
                                    <td className="px-4 py-3">
                                        {p.spotlight ? "yes" : "no"}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Link
                                            href={`/admin/posts/${p.id}`}
                                            className="text-wato-teal no-underline hover:underline"
                                        >
                                            Edit
                                        </Link>
                                        {" · "}
                                        <Link
                                            href={`/blogs/${p.id}`}
                                            className="text-wato-grey no-underline hover:underline"
                                            target="_blank"
                                        >
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {user.role === "admin" ? (
                    <>
                        <h2 className="mb-3 text-xl font-semibold">
                            Authenticated users spreadsheet
                        </h2>
                        <p className="mb-3 text-sm text-wato-grey">
                            Source file:{" "}
                            <code className="text-wato-teal">
                                data/authenticated-users.csv
                            </code>{" "}
                            (edit in Excel / Google Sheets). Passwords are not
                            stored here.
                        </p>
                        <div className="overflow-x-auto rounded-xl bg-wato-black">
                            <table className="w-full min-w-[480px] text-left text-sm">
                                <thead className="border-b border-wato-grey/30 text-wato-teal">
                                    <tr>
                                        <th className="px-4 py-3">Name</th>
                                        <th className="px-4 py-3">Email</th>
                                        <th className="px-4 py-3">Role</th>
                                        <th className="px-4 py-3">Active</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allowlist.map((u) => (
                                        <tr
                                            key={u.email}
                                            className="border-b border-wato-grey/20"
                                        >
                                            <td className="px-4 py-3">{u.name}</td>
                                            <td className="px-4 py-3">{u.email}</td>
                                            <td className="px-4 py-3">{u.role}</td>
                                            <td className="px-4 py-3">
                                                {u.active ? "true" : "false"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : (
                    <p className="text-sm text-wato-grey">
                        You see only posts you own. Admins manage the user
                        allowlist.
                    </p>
                )}
            </div>
        </div>
    );
}

/**
 * Server gate: require session, filter posts by ownership (IDOR),
 * and only expose the full allowlist to admins.
 */
export const getServerSideProps: GetServerSideProps = async (ctx) => {
    const user = await getAuthedAdmin(ctx.req, ctx.res);
    if (!user) {
        return {
            redirect: { destination: "/admin/login", permanent: false },
        };
    }

    const posts = listAdminPosts().filter((p) =>
        canAccessPost(user, p.id, "read")
    );

    const allowlist = requireAdminRole(user)
        ? loadAllUsers().map(({ email, name, role, active }) => ({
              email,
              name,
              role,
              active,
          }))
        : [];

    return {
        props: {
            user,
            posts,
            allowlist,
        },
    };
};
