"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

const links = [
  { href: "/home", label: "Home", icon: "[]" },
  { href: "/threads", label: "Threads", icon: ">>" },
  { href: "/tribes", label: "Tribes", icon: "<>" },
  { href: "/messages", label: "Messages", icon: "@@" },
  { href: "/create", label: "Create", icon: "++" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside className="hidden md:flex flex-col w-56 min-h-[calc(100vh-3.5rem)] bg-surface-1 border-r border-border py-6 px-3 gap-1">
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-mono transition-all duration-200
              ${active
                ? "bg-gold/10 text-gold border border-gold/20"
                : "text-txt-muted hover:text-txt hover:bg-surface-3"
              }`}
          >
            <span className="w-5 text-center text-xs opacity-70">{link.icon}</span>
            {link.label}
          </Link>
        );
      })}

      {user && (
        <div className="mt-auto pt-6 border-t border-border px-3">
          <Link href={`/profile/${user.username}`} className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-full bg-surface-3 flex items-center justify-center text-gold text-xs font-mono">
              {user.username[0].toUpperCase()}
            </div>
            <div>
              <p className="text-sm text-txt group-hover:text-gold transition-colors">{user.username}</p>
              <p className="text-xs text-txt-muted">View profile</p>
            </div>
          </Link>
        </div>
      )}
    </aside>
  );
}
