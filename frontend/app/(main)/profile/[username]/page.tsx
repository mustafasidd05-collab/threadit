"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MessageSquare,
  Settings,
} from "lucide-react";
import { usersApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import ThreadCard from "@/components/ThreadCard";
import { ProfileSkeleton, ThreadCardSkeleton } from "@/components/ui/Skeleton";
import { FadeUp } from "@/lib/animation";

function timeAgo(dateStr: string) {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ProfilePage() {
  const { username } = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isOwn = currentUser?.username === username;

  const load = useCallback(async () => {
    try {
      const [p, t] = await Promise.all([
        usersApi.byUsername(username as string).catch(() => null),
        usersApi.userThreads(username as string).catch(() => []),
      ]);
      setProfile(p);
      setThreads(t);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        <ProfileSkeleton />
        <div className="mt-6 space-y-3">
          {[...Array(2)].map((_, i) => (
            <ThreadCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <FadeUp>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-txt-muted hover:text-gold mb-4 transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>
      </FadeUp>

      {/* Profile Header */}
      <FadeUp delay={0.05}>
        <div className="card mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Avatar */}
            <div className="w-20 h-20 bg-gradient-to-br from-gold/20 to-gold/5 rounded-2xl flex items-center justify-center border border-gold/20 shrink-0">
              {profile.profile_image ? (
                <img
                  src={profile.profile_image}
                  alt=""
                  className="w-full h-full rounded-2xl object-cover"
                />
              ) : (
                <span className="text-3xl font-bold text-gold font-heading">
                  {profile.username?.[0]?.toUpperCase()}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="font-heading font-bold text-xl text-txt">
                  {profile.username}
                </h1>
                {isOwn && (
                  <button className="btn-ghost text-xs flex items-center gap-1">
                    <Settings size={12} />
                    Edit
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-txt-muted mt-2">
                <span className="flex items-center gap-1.5">
                  <Calendar size={12} />
                  Joined {timeAgo(profile.created_at)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={12} />
                  Last seen {timeAgo(profile.last_seen)}
                </span>
                <span className="flex items-center gap-1.5">
                  <MessageSquare size={12} />
                  {threads.length} threads
                </span>
              </div>
            </div>
          </div>
        </div>
      </FadeUp>

      {/* User Threads */}
      <FadeUp delay={0.1}>
        <h2 className="section-title mb-4">
          {isOwn ? "Your Threads" : `Threads by ${profile.username}`}
        </h2>
        {threads.length === 0 ? (
          <div className="card text-center py-12">
            <MessageSquare
              size={32}
              className="text-txt-faint mx-auto mb-3"
            />
            <p className="text-txt-muted font-medium">No threads yet</p>
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