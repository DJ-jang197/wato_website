/**
 * lib/admin/securityLog.ts — Structured security / abuse logging
 * ==============================================================
 * Writes JSON lines to data/security.log (gitignored). Never logs passwords
 * or raw tokens — only action names and safe metadata.
 */

import fs from "fs";
import path from "path";

const LOG_PATH = path.join(process.cwd(), "data", "security.log");

export type SecurityEvent =
    | "auth_attempt"
    | "auth_success"
    | "auth_failure"
    | "api_error"
    | "api_denied"
    | "rate_limited"
    | "unusual_traffic"
    | "password_reset"
    | "email_verify"
    | "idor_blocked";

export const securityLog = (event: SecurityEvent, meta: Record<string, unknown> = {}): void => {
    try {
        const line =
            JSON.stringify({
                ts: new Date().toISOString(),
                event,
                ...meta,
            }) + "\n";
        fs.appendFileSync(LOG_PATH, line, "utf8");
    } catch {
        // Logging must never break the request path.
    }
};
