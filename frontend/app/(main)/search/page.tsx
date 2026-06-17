"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { searchApi } from "@/lib/api";
import type { SearchResults } from "@/lib/types";
import ThreadCard from "@/components/ThreadCard";
import Link from "next/link";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!q) return;
    setLoading(true);
    searchApi.search(q).then(setResults).catch(() => setResults(null)).finally(() => setLoading(false));
  }, [q]);

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="font-heading font-extrabold text-2xl text-txt tracking-tight mb-2">
        Search results for &quot;{q}&quot;
      </h1>

      {loading ? (
        <div className="space-y-4 mt-6">{[...Array(3)].map((_, i) => <div key={i} className="card animate-pulse h-24" />)}</div>
      ) : !results ? (
        <p className="text-txt-muted font-mono text-sm mt-6">Search failed</p>
      ) : (
        <div className="mt-6 space-y-8">
          {/* Threads */}
          {results.threads.length > 0 && (
            <section>
              <h2 className="font-heading font-bold text-gold text-sm mb-3 uppercase tracking-wider">Threads</h2>
              <div className="space-y-3">{results.threads.map((t, i) => <ThreadCard key={t.id} thread={t} index={i} />)}</div>
            </section>
          )}

          {/* Users */}
          {results.users.length > 0 && (
            <section>
              <h2 className="font-heading font-bold text-gold text-sm mb-3 uppercase tracking-wider">Users</h2>
              <div className="space-y-2">
                {results.users.map((u) => (
                  <Link key={u.id} href={`/profile/${u.username}`} className="card flex items-center gap-3 !p-3">
                    <div className="w-8 h-8 rounded-full bg-surface-3 flex items-center justify-center text-gold text-xs font-mono">
                      {u.username[0].toUpperCase()}
                    </div>
                    <span className="text-sm text-txt hover:text-gold transition-colors">@{u.username}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Comments */}
          {results.comments.length > 0 && (
            <section>
              <h2 className="font-heading font-bold text-gold text-sm mb-3 uppercase tracking-wider">Comments</h2>
              <div className="space-y-2">
                {results.comments.map((c) => (
                  <Link key={c.id} href={`/thread/${c.thread_id}`} className="card block !p-3">
                    <p className="text-sm text-txt line-clamp-2">{c.content}</p>
                    <p className="text-xs text-txt-muted mt-1 font-mono">by @{c.author.username} in {c.thread_title}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {results.threads.length === 0 && results.users.length === 0 && results.comments.length === 0 && (
            <p className="text-txt-muted font-mono text-sm">No results found for &quot;{q}&quot;</p>
          )}
        </div>
      )}
    </div>
  );
}
