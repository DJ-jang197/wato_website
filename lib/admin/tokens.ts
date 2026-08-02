/**
 * lib/admin/tokens.ts — Email verification & password-reset tokens
 * ================================================================
 * Tokens are random, stored hashed (sha256), and expire automatically.
 * Raw tokens are never written to logs or returned except once to the caller
 * (or emailed). File store is gitignored.
 */

import crypto from "crypto";
import fs from "fs";
import path from "path";

const STORE_PATH = path.join(process.cwd(), "data", "auth-tokens.json");

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

type TokenKind = "email_verify" | "password_reset";

interface StoredToken {
    hash: string;
    email: string;
    kind: TokenKind;
    expiresAt: number;
}

interface TokenStore {
    tokens: StoredToken[];
}

const hashToken = (raw: string): string =>
    crypto.createHash("sha256").update(raw).digest("hex");

const readStore = (): TokenStore => {
    try {
        if (!fs.existsSync(STORE_PATH)) return { tokens: [] };
        return JSON.parse(fs.readFileSync(STORE_PATH, "utf8")) as TokenStore;
    } catch {
        return { tokens: [] };
    }
};

const writeStore = (store: TokenStore): void => {
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
};

const prune = (store: TokenStore): TokenStore => {
    const now = Date.now();
    return { tokens: store.tokens.filter((t) => t.expiresAt > now) };
};

/** Create a one-time token; returns the RAW token (show/email once). */
export const issueToken = (
    email: string,
    kind: TokenKind
): { raw: string; expiresAt: number } => {
    const raw = crypto.randomBytes(32).toString("hex");
    const ttl = kind === "email_verify" ? VERIFY_TTL_MS : RESET_TTL_MS;
    const expiresAt = Date.now() + ttl;
    const store = prune(readStore());
    // Invalidate older tokens of same kind for this email
    store.tokens = store.tokens.filter(
        (t) => !(t.email === email && t.kind === kind)
    );
    store.tokens.push({
        hash: hashToken(raw),
        email,
        kind,
        expiresAt,
    });
    writeStore(store);
    return { raw, expiresAt };
};

/**
 * Consume a token if valid. Returns email on success, null otherwise.
 * Token is deleted after successful use (one-time).
 */
export const consumeToken = (
    raw: string,
    kind: TokenKind
): string | null => {
    const store = prune(readStore());
    const hash = hashToken(raw);
    const idx = store.tokens.findIndex(
        (t) => t.hash === hash && t.kind === kind
    );
    if (idx < 0) return null;
    const email = store.tokens[idx].email;
    store.tokens.splice(idx, 1);
    writeStore(store);
    return email;
};
