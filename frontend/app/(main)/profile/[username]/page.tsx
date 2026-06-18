"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { usersApi } from "@/lib/api";
import type { User, Thread } from "@/lib/types";
import ThreadCard from "@/components/ThreadCard";
import { ListSkeleton, ProfileSkeleton } from "@/components/Skeleton";
import { formatRelativeTime } from "@/lib/utils";

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [user, setUser] = useState<User | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([usersApi.byUsername(username), usersApi.userThreads(username)])
      .then(([u, t]) => { setUser(u); setThreads(t); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <ProfileSkeleton />
        <div className="h-6 w-40"><div className="animate-pulse bg-surface-3 rounded h-full" /></div>
        <ListSkeleton count={3} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="card text-center py-12">
          <p className="text-txt-muted font-mono">User not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="card flex items-center gap-5 mb-8 fade-up">
        <div className="w-16 h-16 rounded-full bg-surface-3 flex items-center justify-center text-gold text-2xl font-heading font-bold border-2 border-gold/30">
          {user.username[0].toUpperCase()}
        </div>
        <div>
          <h1 className="font-heading font-bold text-2xl text-txt">{user.username}</h1>
          <p className="text-sm text-txt-muted font-mono mt-1">Joined ThreadIt {formatRelativeTime(user.created_at)}</p>
          <p className="text-xs text-txt-muted font-mono mt-0.5">{threads.length} thread{threads.length !== 1 ? "s" : ""} created</p>
        </div>
      </div>
      <h2 className="font-heading font-bold text-lg text-txt mb-4">Threads by {user.username}</h2>
      {threads.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-txt-muted font-mono text-sm">No threads yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {threads.map((thread, i) => <ThreadCard key={thread.id} thread={thread} index={i} />)}
        </div>
      )}
    </div>
  );
}
