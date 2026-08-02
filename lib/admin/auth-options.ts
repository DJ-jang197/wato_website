/**
 * lib/admin/auth-options.ts — NextAuth (Credentials + allowlist + verified email)
 */

import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { findActiveUser, normalizeUwEmail } from "./users";
import { verifyPasswordForEmail } from "./passwordStore";
import { isRateLimited, clearRateLimit, clientIp } from "./rateLimit";
import { appendAudit } from "./audit";
import { securityLog } from "./securityLog";

export const authOptions: NextAuthOptions = {
    session: {
        strategy: "jwt",
        // Sessions expire after 2 hours (idle maxAge for JWT strategy).
        maxAge: 2 * 60 * 60,
        updateAge: 30 * 60,
    },
    useSecureCookies: process.env.NODE_ENV === "production",
    pages: {
        signIn: "/admin/login",
        error: "/admin/login",
    },
    providers: [
        CredentialsProvider({
            name: "WATonomous Admin",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials, req) {
                const emailRaw = credentials?.email || "";
                const password = credentials?.password || "";
                const ip = clientIp({
                    headers: (req?.headers || {}) as Record<
                        string,
                        string | string[] | undefined
                    >,
                });

                securityLog("auth_attempt", { email: emailRaw, ip });

                const email = normalizeUwEmail(emailRaw);
                if (!email || !password) {
                    appendAudit({
                        action: "login",
                        email: emailRaw,
                        detail: "missing_or_invalid_email",
                        ok: false,
                    });
                    securityLog("auth_failure", {
                        reason: "invalid_email",
                        ip,
                    });
                    return null;
                }

                if (isRateLimited("login", `${ip}:${email}`)) {
                    appendAudit({
                        action: "login",
                        email,
                        detail: "rate_limited",
                        ok: false,
                    });
                    securityLog("rate_limited", { bucket: "login", email, ip });
                    return null;
                }

                const user = findActiveUser(email);
                if (!user) {
                    appendAudit({
                        action: "login",
                        email,
                        detail: "not_on_allowlist",
                        ok: false,
                    });
                    securityLog("auth_failure", {
                        reason: "allowlist",
                        email,
                        ip,
                    });
                    return null;
                }

                if (!user.emailVerified) {
                    appendAudit({
                        action: "login",
                        email,
                        detail: "email_unverified",
                        ok: false,
                    });
                    securityLog("auth_failure", {
                        reason: "unverified",
                        email,
                        ip,
                    });
                    return null;
                }

                const ok = await verifyPasswordForEmail(email, password);
                if (!ok) {
                    appendAudit({
                        action: "login",
                        email,
                        detail: "bad_password",
                        ok: false,
                    });
                    securityLog("auth_failure", {
                        reason: "bad_password",
                        email,
                        ip,
                    });
                    return null;
                }

                clearRateLimit("login", `${ip}:${email}`);
                appendAudit({
                    action: "login",
                    email,
                    detail: `role=${user.role}`,
                    ok: true,
                });
                securityLog("auth_success", { email, role: user.role, ip });

                return {
                    id: user.email,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.email = user.email;
                token.name = user.name;
                token.role = (user as { role?: string }).role;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.email = token.email as string;
                session.user.name = token.name as string;
                (session.user as { role?: string }).role = token.role as string;
            }
            return session;
        },
    },
    // Secret stays server-side only — never NEXT_PUBLIC_*.
    secret: process.env.NEXTAUTH_SECRET,
};
