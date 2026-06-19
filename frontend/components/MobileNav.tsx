"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Home, MessageSquare, Users, User } from "lucide-react";

const links = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/threads", label: "Threads", icon: MessageSquare },
  { href: "/tribes", label: "Tribes", icon: Users },
];

export default function MobileNav() {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/50 safe-area-bottom">
      <div className="flex items-center justify-around h-14 px-2">
        {links.map((link) => {
          const active =
            pathname === link.href || pathname?.startsWith(link.href + "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 ${
                active ? "text-gold" : "text-txt-faint"
              }`}
            >
              <link.icon size={20} strokeWidth={active ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium">{link.label}</span>
            </Link>
          );
        })}
        <Link
          href={`/profile/${user.username}`}
          className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 ${
            pathname?.startsWith("/profile") ? "text-gold" : "text-txt-faint"
          }`}
        >
          <User
            size={20}
            strokeWidth={pathname?.startsWith("/profile") ? 2.5 : 1.5}
          />
          <span className="text-[10px] font-medium">Profile</span>
        </Link>
      </div>
    </nav>
  );
}