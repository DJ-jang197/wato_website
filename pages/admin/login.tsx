/**
 * pages/admin/login.tsx — Admin sign-in (top-right Login links here)
 */

import { FormEvent, useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../lib/admin/auth-options";
import { useRouter } from "next/router";

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const onSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        if (result?.error) {
            setError(
                "Sign-in failed. Check email verification, allowlist, and password."
            );
            setLoading(false);
            return;
        }

        // Confirm session exists, then go to dashboard.
        const session = await getSession();
        if (!session) {
            setError("Session was not created. Check server auth configuration.");
            setLoading(false);
            return;
        }

        router.push("/admin");
    };

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-wato-black-vanta px-4 pt-28 pb-16">
            <div className="w-full max-w-md rounded-xl bg-wato-black p-8 text-white shadow-NoOffset">
                <h1 className="mb-2 text-2xl font-bold">
                    Admin login <span className="text-wato-teal">{"//"}</span>
                </h1>
                <p className="mb-6 text-sm text-wato-grey">
                    Only allowlisted, <strong className="font-medium text-white">email-verified</strong>{" "}
                    @uwaterloo.ca accounts can sign in. Passwords are bcrypt-hashed
                    server-side; sessions expire after 2 hours.
                </p>

                <form onSubmit={onSubmit} className="flex flex-col gap-4">
                    {error && (
                        <div className="rounded-md border border-red-400 bg-red-950/40 px-3 py-2 text-sm text-red-200">
                            {error}
                        </div>
                    )}
                    <label className="flex flex-col gap-1 text-sm text-wato-grey">
                        Email
                        <input
                            type="email"
                            autoComplete="username"
                            className="rounded-md border border-wato-grey bg-wato-black-vanta px-3 py-2 text-white outline-none focus:border-wato-teal"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@uwaterloo.ca"
                            required
                        />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-wato-grey">
                        Password
                        <input
                            type="password"
                            autoComplete="current-password"
                            className="rounded-md border border-wato-grey bg-wato-black-vanta px-3 py-2 text-white outline-none focus:border-wato-teal"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </label>
                    <button
                        type="submit"
                        disabled={loading}
                        className="rounded-md bg-wato-teal px-4 py-2 font-medium text-black disabled:opacity-60"
                    >
                        {loading ? "Signing in…" : "Sign in"}
                    </button>
                </form>
                <div className="mt-6 flex flex-col gap-2 text-sm text-wato-grey">
                    <a href="/admin/verify" className="text-wato-teal hover:underline">
                        Verify email
                    </a>
                    <a href="/admin/reset-password" className="text-wato-teal hover:underline">
                        Reset password
                    </a>
                </div>
            </div>
        </div>
    );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
    const session = await getServerSession(ctx.req, ctx.res, authOptions);
    if (session) {
        return { redirect: { destination: "/admin", permanent: false } };
    }
    return { props: {} };
};
