/**
 * pages/admin/reset-password.tsx — Request / confirm password reset
 */

import { FormEvent, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function ResetPasswordPage() {
    const router = useRouter();
    const initialToken = typeof router.query.token === "string" ? router.query.token : "";
    const [email, setEmail] = useState("");
    const [token, setToken] = useState(initialToken);
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const requestReset = async (e: FormEvent) => {
        e.preventDefault();
        setError("");
        setMessage("");
        const res = await fetch("/api/admin/auth/reset?action=request", {
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
                ? `Dev reset token (expires in 1h): ${data.devToken}`
                : "If that account exists, a reset link was sent."
        );
        if (data.devToken) setToken(data.devToken);
    };

    const confirmReset = async (e: FormEvent) => {
        e.preventDefault();
        setError("");
        setMessage("");
        const res = await fetch("/api/admin/auth/reset?action=confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, password }),
        });
        const data = await res.json();
        if (!res.ok) {
            setError(data.error || "Reset failed");
            return;
        }
        setMessage("Password updated. Redirecting to login…");
        setTimeout(() => router.push("/admin/login"), 1200);
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-wato-black-vanta px-4 pt-28 pb-16 text-white">
            <div className="w-full max-w-md rounded-xl bg-wato-black p-8">
                <h1 className="mb-4 text-2xl font-bold">
                    Reset password <span className="text-wato-teal">{"//"}</span>
                </h1>
                {error && <p className="mb-3 text-sm text-red-300">{error}</p>}
                {message && <p className="mb-3 break-all text-sm text-wato-teal">{message}</p>}

                <form onSubmit={requestReset} className="mb-8 flex flex-col gap-3">
                    <input
                        className="rounded-md border border-wato-grey bg-wato-black-vanta px-3 py-2 text-sm"
                        type="email"
                        placeholder="you@uwaterloo.ca"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <button type="submit" className="rounded-md bg-wato-teal px-3 py-2 text-sm font-medium text-black">
                        Request reset token
                    </button>
                </form>

                <form onSubmit={confirmReset} className="flex flex-col gap-3">
                    <input
                        className="rounded-md border border-wato-grey bg-wato-black-vanta px-3 py-2 font-mono text-xs"
                        placeholder="Reset token"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        required
                    />
                    <input
                        className="rounded-md border border-wato-grey bg-wato-black-vanta px-3 py-2 text-sm"
                        type="password"
                        placeholder="New password (min 10 chars)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={10}
                        required
                    />
                    <button type="submit" className="rounded-md border border-wato-teal px-3 py-2 text-sm text-wato-teal">
                        Set new password
                    </button>
                </form>

                <Link href="/admin/login" className="mt-6 inline-block text-sm text-wato-grey">
                    Back to login
                </Link>
            </div>
        </div>
    );
}
