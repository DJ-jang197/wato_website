/**
 * lib/admin/users.ts — Authenticated user spreadsheet (allowlist)
 * ===============================================================
 * BEGINNER NOTE:
 * Real user records live in data/authenticated-users.csv (Excel / Sheets).
 * Passwords are NEVER in this file — see passwordStore.ts.
 *
 * Sign-in rules (cross-checked every time):
 *   1. Email ends with @uwaterloo.ca
 *   2. Email appears in the CSV with active=true
 *   3. email_verified=true (must complete verification link)
 */

import fs from "fs";
import path from "path";

export type AdminRole = "admin" | "author";

export interface AdminUser {
    email: string;
    name: string;
    role: AdminRole;
    active: boolean;
    emailVerified: boolean;
}

const USERS_PATH = path.join(process.cwd(), "data", "authenticated-users.csv");
const UW_DOMAIN = "@uwaterloo.ca";

/**
 * Parse a simple CSV (header + rows). Skips blanks and # comment lines.
 * Does not support quoted commas — keep cells simple.
 */
const parseCsv = (raw: string): AdminUser[] => {
    const lines = raw
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0 && !l.startsWith("#"));

    if (lines.length < 2) return [];

    const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const emailIdx = header.indexOf("email");
    const nameIdx = header.indexOf("name");
    const roleIdx = header.indexOf("role");
    const activeIdx = header.indexOf("active");
    const verifiedIdx = header.indexOf("email_verified");

    if (emailIdx < 0 || nameIdx < 0 || roleIdx < 0 || activeIdx < 0) {
        throw new Error(
            "authenticated-users.csv missing required columns: email,name,role,active"
        );
    }

    const users: AdminUser[] = [];

    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c) => c.trim());
        const email = (cols[emailIdx] || "").toLowerCase();
        const name = cols[nameIdx] || "";
        const roleRaw = (cols[roleIdx] || "").toLowerCase();
        const activeRaw = (cols[activeIdx] || "").toLowerCase();
        const verifiedRaw =
            verifiedIdx >= 0 ? (cols[verifiedIdx] || "").toLowerCase() : "true";

        if (!email) continue;

        const role: AdminRole = roleRaw === "admin" ? "admin" : "author";
        const active =
            activeRaw === "true" || activeRaw === "1" || activeRaw === "yes";
        const emailVerified =
            verifiedRaw === "true" ||
            verifiedRaw === "1" ||
            verifiedRaw === "yes";

        users.push({ email, name, role, active, emailVerified });
    }

    return users;
};

/** Serialize users back to CSV (preserves column order). */
const toCsv = (users: AdminUser[]): string => {
    const rows = [
        "email,name,role,active,email_verified",
        ...users.map(
            (u) =>
                `${u.email},${u.name},${u.role},${u.active},${u.emailVerified}`
        ),
    ];
    return rows.join("\n") + "\n";
};

/** Load every row from the spreadsheet (including inactive). */
export const loadAllUsers = (): AdminUser[] => {
    const raw = fs.readFileSync(USERS_PATH, "utf8");
    return parseCsv(raw);
};

/**
 * Normalize + validate email shape before any auth lookup.
 * Returns null if the string cannot be an allowed UW address.
 */
export const normalizeUwEmail = (input: string): string | null => {
    const email = String(input || "")
        .trim()
        .toLowerCase();

    if (!email || email.includes(" ") || (email.match(/@/g) || []).length !== 1) {
        return null;
    }
    if (!email.endsWith(UW_DOMAIN)) {
        return null;
    }
    const local = email.slice(0, -UW_DOMAIN.length);
    if (!local || !/^[a-z0-9._%+-]+$/i.test(local)) {
        return null;
    }
    return email;
};

/**
 * Cross-reference: email must be UW-shaped AND present + active in the CSV.
 * Does NOT require emailVerified (callers decide).
 */
export const findActiveUser = (emailInput: string): AdminUser | null => {
    const email = normalizeUwEmail(emailInput);
    if (!email) return null;

    const user = loadAllUsers().find((u) => u.email === email);
    if (!user || !user.active) return null;
    return user;
};

/** Mark a user's email as verified in the spreadsheet. */
export const markEmailVerified = (emailInput: string): boolean => {
    const email = normalizeUwEmail(emailInput);
    if (!email) return false;
    const users = loadAllUsers();
    const idx = users.findIndex((u) => u.email === email);
    if (idx < 0) return false;
    users[idx].emailVerified = true;
    fs.writeFileSync(USERS_PATH, toCsv(users), "utf8");
    return true;
};

export const isAdminRole = (role?: string): boolean => role === "admin";
