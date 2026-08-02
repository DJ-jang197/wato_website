/**
 * lib/admin/passwordStore.ts — Per-user bcrypt password hashes (server-only)
 * ========================================================================
 * Hashes live in data/user-password-hashes.json (gitignored).
 * Bootstrap: if a user has no personal hash, fall back to ADMIN_PASSWORD_HASH_B64
 * (shared demo) until they set their own via password reset.
 */

import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

const STORE_PATH = path.join(process.cwd(), "data", "user-password-hashes.json");

type HashMap = Record<string, string>;

const readMap = (): HashMap => {
    try {
        if (!fs.existsSync(STORE_PATH)) return {};
        return JSON.parse(fs.readFileSync(STORE_PATH, "utf8")) as HashMap;
    } catch {
        return {};
    }
};

const writeMap = (map: HashMap): void => {
    fs.writeFileSync(STORE_PATH, JSON.stringify(map, null, 2), "utf8");
};

const sharedBootstrapHash = (): string => {
    const b64 = process.env.ADMIN_PASSWORD_HASH_B64 || "";
    if (b64) {
        try {
            return Buffer.from(b64, "base64").toString("utf8");
        } catch {
            return "";
        }
    }
    return process.env.ADMIN_PASSWORD_HASH || "";
};

/** Resolve the bcrypt hash to use for an email. */
export const getPasswordHashForEmail = (email: string): string => {
    const map = readMap();
    if (map[email]) return map[email];
    return sharedBootstrapHash();
};

export const setPasswordHashForEmail = async (
    email: string,
    plaintext: string
): Promise<void> => {
    if (plaintext.length < 10) {
        throw new Error("Password must be at least 10 characters.");
    }
    const hash = await bcrypt.hash(plaintext, 12);
    const map = readMap();
    map[email] = hash;
    writeMap(map);
};

export const verifyPasswordForEmail = async (
    email: string,
    plaintext: string
): Promise<boolean> => {
    const hash = getPasswordHashForEmail(email);
    if (!hash) return false;
    return bcrypt.compare(plaintext, hash);
};
