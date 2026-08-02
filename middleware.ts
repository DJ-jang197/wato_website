/**
 * middleware.ts — Edge security gate
 * ==================================
 * - Forces HTTPS in production (via x-forwarded-proto from the host)
 * - Blocks obviously abusive probe paths
 * There is no public database to expose; markdown + env stay server-side.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SUSPICIOUS =
    /(\.env|wp-admin|phpmyadmin|\.git|\/\.aws|\/\.docker)/i;

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.ip ||
        "unknown";

    if (SUSPICIOUS.test(pathname)) {
        // Edge-safe unusual-traffic signal (host log aggregation / SIEM).
        console.warn(
            JSON.stringify({
                type: "unusual_traffic",
                path: pathname,
                ip,
                ua: req.headers.get("user-agent") || "",
            })
        );
        return new NextResponse("Not found", { status: 404 });
    }

    if (process.env.NODE_ENV === "production") {
        const proto = req.headers.get("x-forwarded-proto");
        if (proto && proto !== "https") {
            const url = req.nextUrl.clone();
            url.protocol = "https:";
            return NextResponse.redirect(url, 308);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Run on all paths except Next static assets.
         */
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};
