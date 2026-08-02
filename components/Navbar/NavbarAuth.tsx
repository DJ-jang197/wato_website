/**
 * components/Navbar/NavbarAuth.tsx — Top-right Login / Admin / Sign out
 * =====================================================================
 * Placed at the end of the navbar (visually top-right on desktop).
 */

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

interface NavbarAuthProps {
    toggle?: () => void;
}

const NavbarAuth = ({ toggle }: NavbarAuthProps) => {
    const { data: session, status } = useSession();

    const base =
        "pointer-events-auto mx-2 flex cursor-pointer list-none items-center justify-center py-2 text-sm font-medium uppercase tracking-wide text-white transition-colors hover:text-wato-teal lg:py-0";

    if (status === "loading") {
        return <li className={`${base} text-wato-grey`}>…</li>;
    }

    if (session?.user) {
        return (
            <>
                <li className={base}>
                    <Link
                        href="/admin"
                        onClick={toggle}
                        className="no-underline text-inherit"
                    >
                        Admin
                    </Link>
                </li>
                <li className={base}>
                    <button
                        type="button"
                        className="border-0 bg-transparent uppercase text-inherit"
                        onClick={() => {
                            toggle?.();
                            signOut({ callbackUrl: "/" });
                        }}
                    >
                        Sign out
                    </button>
                </li>
            </>
        );
    }

    return (
        <li className={base}>
            <Link
                href="/admin/login"
                onClick={toggle}
                className="rounded-md border border-wato-teal px-3 py-1 text-wato-teal no-underline hover:bg-wato-teal hover:text-black"
            >
                Login
            </Link>
        </li>
    );
};

export default NavbarAuth;
