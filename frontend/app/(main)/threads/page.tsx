"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { MessageSquare, SlidersHorizontal } from "lucide-react";
import { threadsApi } from "@/lib/api";
import ThreadCard from "@/components/ThreadCard";
import CreateThreadForm from "@/components/CreateThreadForm";
import { ThreadCardSkeleton } from "@/components/ui/Skeleton";
import { FadeUp } from "@/lib/animation";

export default function ThreadsPage() {
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await threadsApi.list(0, 50);
      setThreads(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <FadeUp>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading font-bold text-2xl text-txt">
              Threads
            </h1>
            <p className="text-sm text-txt-muted mt-1">
              All conversations in one place
            </p>
          </div>
          <button className="btn-icon">
            <SlidersHorizontal size={18} />
          </button>
        </div>
      </FadeUp>

      <CreateThreadForm onCreated={load} />

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <ThreadCardSkeleton key={i} />
          ))}
        </div>
      ) : threads.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card text-center py-16"
        >
          <MessageSquare
            size={40}
            className="text-txt-faint mx-auto mb-4"
          />
          <p className="font-heading font-semibold text-lg text-txt mb-2">
            No threads yet
          </p>
          <p className="text-txt-muted text-sm">
            Be the first to start a conversation
          </p>
        </motion.div>
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