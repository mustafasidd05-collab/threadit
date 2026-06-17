"use client";

import { useEffect, useState } from "react";
import { threadsApi } from "@/lib/api";
import type { Thread } from "@/lib/types";
import ThreadCard from "@/components/ThreadCard";
import Link from "next/link";

export default function HomePage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const limit = 20;

  const loadThreads = () => {
    setLoading(true);
    threadsApi.list(page * limit, limit)
      .then(setThreads)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadThreads(); }, [page]);

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="font-heading font-extrabold text-3xl text-txt tracking-tight">Home</h1>
          <p className="text-txt-muted text-sm mt-1">Latest discussions from the community</p>
        </div>
        <Link href="/create" className="btn-primary text-sm">+ New Thread</Link>
      </div>
      {loading ? (
        <div className="space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="card animate-pulse h-28" />)}</div>
      ) : threads.length === 0 ? (
        <div className="card text-center py-12"><p className="text-txt-muted font-mono text-sm">No threads yet. Be the first to start a discussion.</p></div>
      ) : (
        <div className="space-y-3">{threads.map((thread, i) => <ThreadCard key={thread.id} thread={thread} index={i} onDelete={loadThreads} />)}</div>
      )}
      <div className="flex justify-center gap-3 mt-8">
        <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="btn-secondary text-sm disabled:opacity-30">Previous</button>
        <span className="flex items-center text-sm text-txt-muted font-mono">Page {page + 1}</span>
        <button onClick={() => setPage(page + 1)} disabled={threads.length < limit} className="btn-secondary text-sm disabled:opacity-30">Next</button>
      </div>
    </div>
  );
}
