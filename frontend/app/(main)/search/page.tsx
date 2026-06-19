"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { searchApi } from "@/lib/api";
import type { SearchResults } from "@/lib/types";
import ThreadCard from "@/components/ThreadCard";
import Link from "next/link";
import { FadeUp } from "@/lib/animation";
import { Search, Users, MessageSquare, Loader2 } from "lucide-react";

function SearchContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!q) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    searchApi
      .search(q)
      .then((data) => {
        console.log("Search results:", data);
        setResults(data);
      })
      .catch((err) => {
        console.error("Search error:", err);
        setError(err.message || "Search failed");
        setResults(null);
      })
      .finally(() => setLoading(false));
  }, [q]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <FadeUp>
        <div className="mb-6">
          <h1 className="font-heading font-bold text-2xl text-txt flex items-center gap-2">
            <Search size={22} className="text-gold" />
            Search results
          </h1>
          {q && (
            <p className="text-sm text-txt-muted mt-1">
              for &ldquo;{q}&rdquo;
            </p>
          )}
        </div>
      </FadeUp>

      {!q ? (
        <div className="card text-center py-12">
          <Search size={32} className="text-txt-faint mx-auto mb-3" />
          <p className="text-txt-muted font-medium">
            Type something to search
          </p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-gold" />
        </div>
      ) : error ? (
        <div className="card text-center py-12">
          <p className="text-down text-sm">{error}</p>
        </div>
      ) : !results ? (
        <div className="card text-center py-12">
          <p className="text-txt-muted text-sm">Search failed</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Threads */}
          {results.threads && results.threads.length > 0 && (
            <FadeUp>
              <h2 className="font-heading font-bold text-gold text-sm mb-3 uppercase tracking-wider flex items-center gap-2">
                <MessageSquare size={14} />
                Threads ({results.threads.length})
              </h2>
              <div className="space-y-3">
                {results.threads.map((t: any, i: number) => (
                  <ThreadCard key={t.id} thread={t} index={i} />
                ))}
              </div>
            </FadeUp>
          )}

          {/* Users */}
          {results.users && results.users.length > 0 && (
            <FadeUp>
              <h2 className="font-heading font-bold text-gold text-sm mb-3 uppercase tracking-wider flex items-center gap-2">
                <Users size={14} />
                Users ({results.users.length})
              </h2>
              <div className="space-y-2">
                {results.users.map((u: any) => (
                  <Link
                    key={u.id}
                    href={`/profile/${u.username}`}
                    className="card-interactive flex items-center gap-3 !p-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-surface-3 flex items-center justify-center border border-border">
                      <span className="text-xs font-bold text-gold">
                        {u.username?.[0]?.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-txt">
                      {u.username}
                    </span>
                  </Link>
                ))}
              </div>
            </FadeUp>
          )}

          {/* Comments */}
          {results.comments && results.comments.length > 0 && (
            <FadeUp>
              <h2 className="font-heading font-bold text-gold text-sm mb-3 uppercase tracking-wider">
                Comments ({results.comments.length})
              </h2>
              <div className="space-y-2">
                {results.comments.map((c: any) => (
                  <Link
                    key={c.id}
                    href={`/thread/${c.thread_id}`}
                    className="card-interactive block !p-3"
                  >
                    <p className="text-sm text-txt line-clamp-2">
                      {c.content}
                    </p>
                    <p className="text-xs text-txt-muted mt-1 font-mono">
                      by @{c.author?.username} in {c.thread_title}
                    </p>
                  </Link>
                ))}
              </div>
            </FadeUp>
          )}

          {/* No results */}
          {results.threads?.length === 0 &&
            results.users?.length === 0 &&
            results.comments?.length === 0 && (
              <div className="card text-center py-12">
                <Search
                  size={32}
                  className="text-txt-faint mx-auto mb-3"
                />
                <p className="text-txt-muted font-medium">
                  No results found for &ldquo;{q}&rdquo;
                </p>
              </div>
            )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-gold" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}