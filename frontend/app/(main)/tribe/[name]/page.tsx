"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Users,
  MessageSquare,
  Plus,
  Loader2,
  Check,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { tribesApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import ThreadCard from "@/components/ThreadCard";
import CreateThreadForm from "@/components/CreateThreadForm";
import { ThreadCardSkeleton } from "@/components/ui/Skeleton";
import { FadeUp } from "@/lib/animation";

export default function TribePage() {
  const { name } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [tribe, setTribe] = useState<any>(null);
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joinState, setJoinState] = useState<"idle" | "joining" | "joined">(
    "idle"
  );

  const load = useCallback(async () => {
    try {
      const [t, th] = await Promise.all([
        tribesApi.detail(name as string).catch(() => null),
        tribesApi.threads(name as string, 0, 50).catch(() => []),
      ]);
      setTribe(t);
      setThreads(th);
      if (t?.is_member) setJoinState("joined");
    } finally {
      setLoading(false);
    }
  }, [name]);

  useEffect(() => {
    load();
  }, [load]);

  const handleJoin = async () => {
    if (!tribe || joining) return;
    setJoining(true);
    setJoinState("joining");
    try {
      await tribesApi.join(tribe.id);
      setJoinState("joined");
      setTribe({ ...tribe, member_count: (tribe.member_count || 0) + 1 });
    } catch {
      setJoinState("idle");
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="card mb-6 animate-pulse">
          <div className="h-24 bg-surface-2 rounded-xl mb-4 shimmer-bg" />
          <div className="h-6 w-40 shimmer-bg rounded-lg mb-2" />
          <div className="h-4 w-64 shimmer-bg rounded-lg" />
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <ThreadCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!tribe) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* Back */}
      <FadeUp>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-txt-muted hover:text-gold mb-4 transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>
      </FadeUp>

      {/* Tribe Header */}
      <FadeUp delay={0.05}>
        <div className="card mb-6 overflow-hidden">
          {/* Banner */}
          <div className="h-24 -mx-5 -mt-5 bg-gradient-to-br from-gold/20 via-surface-2 to-surface-3 mb-4 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-surface-1/80 to-transparent" />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 relative z-10">
            <div className="w-16 h-16 bg-gradient-to-br from-gold/30 to-gold/10 rounded-2xl flex items-center justify-center border-2 border-gold/30 shadow-float">
              <span className="text-2xl font-bold text-gold font-heading">
                {tribe.name?.[0]?.toUpperCase()}
              </span>
            </div>

            <div className="flex-1">
              <h1 className="font-heading font-bold text-2xl text-txt">
                t/{tribe.name}
              </h1>
              <div className="flex items-center gap-3 mt-1 text-xs text-txt-muted">
                <span className="flex items-center gap-1">
                  <Users size={12} />
                  {tribe.member_count ?? 0} members
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare size={12} />
                  {threads.length} threads
                </span>
              </div>
            </div>

            {joinState !== "joined" ? (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleJoin}
                disabled={joining}
                className="btn-primary flex items-center gap-2 shrink-0"
              >
                {joinState === "joining" ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Plus size={16} />
                )}
                {joinState === "joining" ? "Joining..." : "Join Tribe"}
              </motion.button>
            ) : (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="btn-secondary flex items-center gap-2 shrink-0 text-up border-up/30 cursor-default"
              >
                <Check size={16} />
                Joined
              </motion.div>
            )}
          </div>

          {tribe.description && (
            <p className="text-sm text-txt-muted leading-relaxed mt-4 pt-4 border-t border-border">
              {tribe.description}
            </p>
          )}
        </div>
      </FadeUp>

      {/* Thread Creation */}
      {joinState === "joined" && (
        <FadeUp delay={0.1}>
          <CreateThreadForm tribeId={tribe.id} onCreated={load} />
        </FadeUp>
      )}

      {/* Threads */}
      <FadeUp delay={0.15}>
        <h2 className="section-title mb-4">Threads</h2>
        {threads.length === 0 ? (
          <div className="card text-center py-12">
            <MessageSquare
              size={32}
              className="text-txt-faint mx-auto mb-3"
            />
            <p className="text-txt-muted font-medium">No threads yet</p>
            <p className="text-txt-faint text-sm mt-1">
              {joinState === "joined"
                ? "Be the first to post something"
                : "Join this tribe to start posting"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {threads.map((thread, i) => (
              <ThreadCard key={thread.id} thread={thread} index={i} />
            ))}
          </div>
        )}
      </FadeUp>
    </div>
  );
}