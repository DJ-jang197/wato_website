/**
 * lib/admin/audit.ts — Append-only admin audit log
 * ================================================
 * Writes to data/admin-audit.jsonl (gitignored). Never logs passwords.
 */

import fs from "fs";
import path from "path";

const AUDIT_PATH = path.join(process.cwd(), "data", "admin-audit.jsonl");

export const appendAudit = (entry: {
    action: string;
    email?: string;
    detail?: string;
    ok: boolean;
}): void => {
    try {
        const line =
            JSON.stringify({
                ts: new Date().toISOString(),
                action: entry.action,
                email: entry.email || null,
                detail: entry.detail || null,
                ok: entry.ok,
            }) + "\n";
        fs.appendFileSync(AUDIT_PATH, line, "utf8");
    } catch {
        // Audit failures must not break login/publish.
    }
};
