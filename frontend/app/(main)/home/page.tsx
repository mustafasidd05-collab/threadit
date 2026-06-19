"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Users,
  MessageSquare,
  ArrowRight,
  Sparkles,
  Flame,
} from "lucide-react";
import { threadsApi, tribesApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import ThreadCard from "@/components/ThreadCard";
import { ThreadCardSkeleton, TribeCardSkeleton } from "@/components/ui/Skeleton";
import { FadeUp, StaggerList, StaggerItem } from "@/lib/animation";

export default function HomePage() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<any[]>([]);
  const [tribes, setTribes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [t, tr] = await Promise.all([
          threadsApi.list(0, 10).catch(() => []),
          tribesApi.list().catch(() => []),
        ]);
        setThreads(t);
        setTribes(tr);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* Hero */}
      <FadeUp>
        <section className="mb-10">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-surface-1 via-surface-2 to-surface-1 p-8 md:p-12">
            {/* Background glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/5 rounded-full blur-3xl" />

            <div className="relative">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-2 mb-4"
              >
                <Sparkles size={16} className="text-gold" />
                <span className="text-xs font-mono text-gold uppercase tracking-wider">
                  Welcome back
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="font-heading font-bold text-3xl md:text-4xl text-txt mb-3"
              >
                {user ? `Hey, ${user.username}` : "Welcome to ThreadIt"}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-txt-muted text-base max-w-lg"
              >
                A place where ideas become conversations. Explore communities,
                share your thoughts, and connect with others.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="flex flex-wrap gap-6 mt-6"
              >
                <div className="flex items-center gap-2 text-sm text-txt-muted">
                  <div className="w-8 h-8 bg-up/10 rounded-lg flex items-center justify-center">
                    <MessageSquare size={14} className="text-up" />
                  </div>
                  <div>
                    <p className="font-mono font-bold text-txt text-lg leading-none">
                      {threads.length}+
                    </p>
                    <p className="text-xs text-txt-faint">Threads</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-txt-muted">
                  <div className="w-8 h-8 bg-gold/10 rounded-lg flex items-center justify-center">
                    <Users size={14} className="text-gold" />
                  </div>
                  <div>
                    <p className="font-mono font-bold text-txt text-lg leading-none">
                      {tribes.length}+
                    </p>
                    <p className="text-xs text-txt-faint">Tribes</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </FadeUp>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="section-title flex items-center gap-2">
              <Flame size={18} className="text-gold" />
              Trending Threads
            </h2>
            <Link
              href="/threads"
              className="text-sm text-txt-muted hover:text-gold flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <ThreadCardSkeleton key={i} />
              ))}
            </div>
          ) : threads.length === 0 ? (
            <div className="card text-center py-12">
              <MessageSquare
                size={32}
                className="text-txt-faint mx-auto mb-3"
              />
              <p className="text-txt-muted font-medium">
                No threads yet
              </p>
              <p className="text-txt-faint text-sm mt-1">
                Be the first to start a conversation
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {threads.map((thread, i) => (
                <ThreadCard key={thread.id} thread={thread} index={i} />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Popular Tribes */}
          <div>
            <h2 className="section-title flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-gold" />
              Popular Tribes
            </h2>

            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <TribeCardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <StaggerList className="space-y-2">
                {tribes.slice(0, 5).map((tribe) => (
                  <StaggerItem key={tribe.id}>
                    <Link href={`/tribe/${tribe.name}`}>
                      <div className="card-interactive flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-gold/20 to-gold/5 rounded-xl flex items-center justify-center border border-gold/20">
                          <span className="text-sm font-bold text-gold">
                            {tribe.name?.[0]?.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-txt truncate">
                            t/{tribe.name}
                          </p>
                          <p className="text-xs text-txt-faint truncate">
                            {tribe.member_count ?? 0} members
                          </p>
                        </div>
                        <ArrowRight size={14} className="text-txt-faint" />
                      </div>
                    </Link>
                  </StaggerItem>
                ))}
              </StaggerList>
            )}

            <Link
              href="/tribes"
              className="btn-secondary w-full mt-3 flex items-center justify-center gap-2 text-sm"
            >
              Browse all tribes
            </Link>
          </div>

          {/* Quick Links */}
          <div className="card">
            <h3 className="font-heading font-semibold text-sm text-txt mb-3">
              Quick Links
            </h3>
            <div className="space-y-1">
              <Link
                href="/threads"
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-txt-muted hover:text-gold hover:bg-gold-dim transition-colors"
              >
                <MessageSquare size={14} />
                All Threads
              </Link>
              <Link
                href="/tribes"
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-txt-muted hover:text-gold hover:bg-gold-dim transition-colors"
              >
                <Users size={14} />
                Browse Tribes
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}