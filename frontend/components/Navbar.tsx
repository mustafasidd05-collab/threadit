"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-40 bg-base/80 backdrop-blur-xl border-b border-border">
      <div className="flex items-center justify-between h-14 px-5">
        <Link href="/home" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 bg-gold rounded-md flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
            <span className="text-base font-heading font-bold text-sm">T</span>
          </div>
          <span className="font-heading font-bold text-lg tracking-tight text-txt group-hover:text-gold transition-colors">
            ThreadIt
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/create" className="btn-primary text-sm !px-4 !py-1.5">
                New Thread
              </Link>
              <Link
                href={`/profile/${user.username}`}
                className="text-sm text-txt-muted hover:text-gold transition-colors"
              >
                {user.username}
              </Link>
              <button onClick={handleLogout} className="btn-ghost text-sm">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost text-sm">Log in</Link>
              <Link href="/signup" className="btn-primary text-sm !px-4 !py-1.5">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
