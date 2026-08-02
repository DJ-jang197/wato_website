import NextAuth from "next-auth";
import { authOptions } from "../../../lib/admin/auth-options";

/**
 * NextAuth catch-all API route.
 * Handles /api/auth/signin, /api/auth/callback/credentials, /api/auth/signout, /api/auth/session
 */
export default NextAuth(authOptions);
