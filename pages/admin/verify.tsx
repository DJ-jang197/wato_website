/**
 * pages/admin/verify.tsx — Confirm email verification token
 */

import { FormEvent, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function VerifyEmailPage() {
    const router = useRouter();
    const initialToken = typeof router.query.token === "string" ? router.query.token : "";
    const [token, setToken] = useState(initialToken);
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const requestLink = async (e: FormEvent) => {
        e.preventDefault();
        setError("");
        setMessage("");
        const res = await fetch("/api/admin/auth/verify?action=request", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (!res.ok) {
            setError(data.error || "Request failed");
            return;
        }
        setMessage(
            data.devToken
                ? `Dev token (email not configured): ${data.devToken}`
                : "If that email is eligible, a verification link was sent."
        );
        if (data.devToken) setToken(data.devToken);
    };

    const confirm = async (e: FormEvent) => {
        e.preventDefault();
        setError("");
        setMessage("");
        const res = await fetch("/api/admin/auth/verify?action=confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (!res.ok) {
            setError(data.error || "Verification failed");
            return;
        }
        setMessage("Email verified. You can sign in now.");
        setTimeout(() => router.push("/admin/login"), 1200);
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-wato-black-vanta px-4 pt-28 pb-16 text-white">
            <div className="w-full max-w-md rounded-xl bg-wato-black p-8">
                <h1 className="mb-4 text-2xl font-bold">
                    Verify email <span className="text-wato-teal">{"//"}</span>
                </h1>
                {error && <p className="mb-3 text-sm text-red-300">{error}</p>}
                {message && <p className="mb-3 text-sm text-wato-teal">{message}</p>}

                <form onSubmit={requestLink} className="mb-8 flex flex-col gap-3">
                    <p className="text-sm text-wato-grey">Request a verification token</p>
                    <input
                        className="rounded-md border border-wato-grey bg-wato-black-vanta px-3 py-2 text-sm"
                        type="email"
                        placeholder="you@uwaterloo.ca"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <button type="submit" className="rounded-md bg-wato-teal px-3 py-2 text-sm font-medium text-black">
                        Send verification
                    </button>
                </form>

                <form onSubmit={confirm} className="flex flex-col gap-3">
                    <p className="text-sm text-wato-grey">Paste token to confirm</p>
                    <input
                        className="rounded-md border border-wato-grey bg-wato-black-vanta px-3 py-2 font-mono text-xs"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        required
                    />
                    <button type="submit" className="rounded-md border border-wato-teal px-3 py-2 text-sm text-wato-teal">
                        Confirm email
                    </button>
                </form>

                <Link href="/admin/login" className="mt-6 inline-block text-sm text-wato-grey">
                    Back to login
                </Link>
            </div>
        </div>
    );
}
