"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { tribesApi } from "@/lib/api";
import type { Tribe, Thread } from "@/lib/types";
import ThreadCard from "@/components/ThreadCard";
import CreateThreadForm from "@/components/CreateThreadForm";
import { ListSkeleton, TribeCardSkeleton } from "@/components/Skeleton";
import { useAuth } from "@/lib/auth";
import { formatRelativeTime } from "@/lib/utils";

export default function TribePage() {
  const params = useParams();
  const tribeName = params.name as string;
  const { user } = useAuth();
  const [tribe, setTribe] = useState<Tribe | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinLoading, setJoinLoading] = useState(false);

  const loadTribe = async () => {
    try {
      const t = await tribesApi.detail(tribeName);
      setTribe(t);
      const th = await tribesApi.threads(tribeName);
      setThreads(th);
    } catch {
      setTribe(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTribe();
  }, [tribeName]);

  const handleJoinLeave = async () => {
    if (!tribe) return;
    setJoinLoading(true);

    // Optimistic update
    const wasMember = tribe.is_member;
    setTribe({
      ...tribe,
      is_member: !wasMember,
      member_count: wasMember ? tribe.member_count - 1 : tribe.member_count + 1,
    });

    try {
      if (wasMember) {
        await tribesApi.leave(tribe.id);
      } else {
        await tribesApi.join(tribe.id);
      }
    } catch {
      // Revert
      setTribe({
        ...tribe,
        is_member: wasMember,
        member_count: tribe.member_count,
      });
    } finally {
      setJoinLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <TribeCardSkeleton />
        <ListSkeleton count={3} />
      </div>
    );
  }

  if (!tribe) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="card text-center py-12">
          <p className="text-txt-muted font-mono">Tribe not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="card mb-8 fade-up">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-heading font-extrabold text-3xl text-txt tracking-tight">t/{tribe.name}</h1>
            <p className="text-txt-muted mt-2">{tribe.description}</p>
            <div className="flex items-center gap-4 mt-3 text-xs text-txt-muted font-mono">
              <span>{tribe.member_count} member{tribe.member_count !== 1 ? "s" : ""}</span>
              <span>Created {formatRelativeTime(tribe.created_at)}</span>
              <span>by @{tribe.creator.username}</span>
            </div>
          </div>
          <button
            onClick={handleJoinLeave}
            disabled={joinLoading}
            className={`${tribe.is_member ? "btn-secondary text-sm" : "btn-primary text-sm"} flex items-center gap-2`}
          >
            {joinLoading && (
              <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            )}
            {tribe.is_member ? "Leave" : "Join"}
          </button>
        </div>
      </div>

      {tribe.is_member && (
        <div className="mb-6">
          <CreateThreadForm tribeId={tribe.id} onSuccess={loadTribe} />
        </div>
      )}

      <h2 className="font-heading font-bold text-lg text-txt mb-4">Posts in t/{tribe.name}</h2>
      {threads.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-txt-muted font-mono text-sm">
            No posts yet. {tribe.is_member ? "Be the first!" : "Join to create a post."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {threads.map((thread, i) => (
            <ThreadCard key={thread.id} thread={thread} index={i} onDelete={loadTribe} />
          ))}
        </div>
      )}
    </div>
  );
}
