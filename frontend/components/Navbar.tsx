"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  MessageSquare,
  Users,
  Search,
  User,
  LogOut,
  Plus,
  ChevronDown,
} from "lucide-react";

const navLinks = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/threads", label: "Threads", icon: MessageSquare },
  { href: "/tribes", label: "Tribes", icon: Users },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  if (!user) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
          {/* Logo */}
          <Link href="/home" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 bg-gold rounded-xl flex items-center justify-center">
              <span className="font-heading font-bold text-base text-sm">
                T
              </span>
            </div>
            <span className="font-heading font-bold text-lg text-txt hidden sm:block">
              ThreadIt
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 ml-6">
            {navLinks.map((link) => {
              const active =
                pathname === link.href ||
                pathname?.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all duration-200 ${
                    active
                      ? "text-gold bg-gold-dim"
                      : "text-txt-muted hover:text-txt hover:bg-surface-2"
                  }`}
                >
                  <link.icon size={16} />
                  {link.label}
                  {active && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 bg-gold-dim rounded-xl -z-10"
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Search Toggle */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="btn-icon"
          >
            <Search size={18} />
          </button>

          {/* New Thread */}
          <Link
            href="/threads"
            className="btn-primary hidden sm:flex items-center gap-1.5 text-xs"
          >
            <Plus size={14} />
            New Thread
          </Link>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-surface-2 transition-colors duration-200"
            >
              <div className="w-8 h-8 bg-surface-3 rounded-full flex items-center justify-center border border-border">
                {user.profile_image ? (
                  <img
                    src={user.profile_image}
                    alt=""
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-bold text-gold">
                    {user.username?.[0]?.toUpperCase()}
                  </span>
                )}
              </div>
              <ChevronDown
                size={14}
                className={`text-txt-muted transition-transform duration-200 hidden sm:block ${
                  menuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMenuOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-12 w-56 z-50 glass rounded-xl shadow-float border border-border overflow-hidden"
                  >
                    <div className="p-3 border-b border-border">
                      <p className="text-sm font-semibold text-txt truncate">
                        {user.username}
                      </p>
                      <p className="text-xs text-txt-muted truncate">
                        {user.email}
                      </p>
                    </div>
                    <div className="p-1.5">
                      <Link
                        href={`/profile/${user.username}`}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-txt-muted hover:text-txt hover:bg-surface-2 transition-colors"
                      >
                        <User size={15} />
                        Profile
                      </Link>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          logout();
                        }}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-down hover:bg-down/10 transition-colors w-full"
                      >
                        <LogOut size={15} />
                        Log out
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Search Bar */}
        <AnimateIn show={searchOpen}>
          <form
            onSubmit={handleSearch}
            className="border-t border-border px-4 py-3"
          >
            <div className="max-w-6xl mx-auto">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-faint"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search threads, tribes, users..."
                  className="input-field pl-10"
                  autoFocus
                />
              </div>
            </div>
          </form>
        </AnimateIn>
      </header>
    </>
  );
}

function AnimateIn({
  show,
  children,
}: {
  show: boolean;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}