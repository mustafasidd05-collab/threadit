"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { searchApi } from "@/lib/api";
import type { SearchResults } from "@/lib/types";
import Link from "next/link";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Click outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults(null);
      setOpen(false);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchApi.search(query);
        setResults(data);
        setOpen(true);
      } catch {
        setResults(null);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setOpen(false);
    }
  };

  const hasResults = results && (results.threads.length > 0 || results.users.length > 0 || results.comments.length > 0);

  return (
    <div ref={ref} className="relative w-80">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search ThreadIt..."
          className="w-full bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-sm text-txt
                     placeholder:text-txt-muted/50 focus:outline-none focus:border-gold focus:ring-1
                     focus:ring-gold/30 transition-all"
        />
      </form>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-surface-2 border border-border
                        rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto">
          {loading && (
            <div className="p-4 text-center text-txt-muted text-sm font-mono">Searching...</div>
          )}

          {!loading && !hasResults && (
            <div className="p-4 text-center text-txt-muted text-sm font-mono">No results found</div>
          )}

          {!loading && results && results.threads.length > 0 && (
            <div className="p-2">
              <p className="px-2 py-1 text-xs font-mono text-gold uppercase tracking-wider">Threads</p>
              {results.threads.slice(0, 3).map((t) => (
                <Link
                  key={t.id}
                  href={`/thread/${t.id}`}
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm text-txt hover:bg-surface-3 transition-colors"
                >
                  {t.title}
                  <span className="block text-xs text-txt-muted">by @{t.author?.username || "unknown"}</span>
                </Link>
              ))}
            </div>
          )}

          {!loading && results && results.users.length > 0 && (
            <div className="p-2 border-t border-border">
              <p className="px-2 py-1 text-xs font-mono text-gold uppercase tracking-wider">Users</p>
              {results.users.slice(0, 3).map((u) => (
                <Link
                  key={u.id}
                  href={`/profile/${u.username}`}
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm text-txt hover:bg-surface-3 transition-colors"
                >
                  @{u.username}
                </Link>
              ))}
            </div>
          )}

          {!loading && results && results.comments.length > 0 && (
            <div className="p-2 border-t border-border">
              <p className="px-2 py-1 text-xs font-mono text-gold uppercase tracking-wider">Comments</p>
              {results.comments.slice(0, 3).map((c) => (
                <Link
                  key={c.id}
                  href={`/thread/${c.thread_id}`}
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm text-txt hover:bg-surface-3 transition-colors"
                >
                  <span className="line-clamp-1">{c.content}</span>
                  <span className="block text-xs text-txt-muted">in {c.thread_title}</span>
                </Link>
              ))}
            </div>
          )}

          {!loading && hasResults && (
            <Link
              href={`/search?q=${encodeURIComponent(query)}`}
              onClick={() => setOpen(false)}
              className="block p-3 text-center text-sm text-gold hover:bg-surface-3
                         border-t border-border transition-colors"
            >
              View all results for &quot;{query}&quot;
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
