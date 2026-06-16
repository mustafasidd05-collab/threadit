"use client";

import { useEffect, useState } from "react";
import { threadsApi } from "@/lib/api";
import type { Thread } from "@/lib/types";
import ThreadCard from "@/components/ThreadCard";

export default function ThreadsPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    threadsApi
      .list(0, 50)
      .then(setThreads)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="font-heading font-extrabold text-3xl text-txt tracking-tight mb-8">
        All Threads
      </h1>
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card animate-pulse h-28" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {threads.map((thread, i) => (
            <ThreadCard key={thread.id} thread={thread} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
