/**
 * lib/admin/requireAuth.ts — Server-side gate for admin pages & APIs
 */

import type { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth-options";
import { findActiveUser, AdminUser, isAdminRole } from "./users";

export interface AuthedAdmin {
    email: string;
    name: string;
    role: AdminUser["role"];
}

export { isAdminRole };

export const getAuthedAdmin = async (
    req: NextApiRequest | GetServerSidePropsContext["req"],
    res: NextApiResponse | GetServerSidePropsContext["res"]
): Promise<AuthedAdmin | null> => {
    const session = await getServerSession(req, res, authOptions);
    const email = session?.user?.email;
    if (!email) return null;

    const user = findActiveUser(email);
    if (!user || !user.emailVerified) return null;

    return {
        email: user.email,
        name: user.name,
        role: user.role,
    };
};

export const requireAdminRole = (user: AuthedAdmin): boolean =>
    isAdminRole(user.role);
