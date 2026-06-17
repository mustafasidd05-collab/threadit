"use client";

import Link from "next/link";
import type { Thread } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { threadsApi } from "@/lib/api";
import VoteButtons from "./VoteButtons";
import { formatRelativeTime } from "@/lib/utils";
import { useState } from "react";

interface Props {
  thread: Thread;
  index?: number;
  onDelete?: () => void;
}

export default function ThreadCard({ thread, index = 0, onDelete }: Props) {
  const { user } = useAuth();
  const [deleted, setDeleted] = useState(false);
  const timeAgo = formatRelativeTime(thread.created_at);
  const isAuthor = user?.id === thread.author.id;

  const handleDelete = async () => {
    if (!confirm("Delete this thread?")) return;
    try {
      await threadsApi.delete(thread.id);
      setDeleted(true);
      onDelete?.();
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (deleted) return null;

  return (
    <div className="card flex gap-4 fade-up" style={{ animationDelay: `${index * 0.06}s` }}>
      <VoteButtons threadId={thread.id} voteInfo={thread.vote_info} />

      <div className="flex-1 min-w-0">
        <Link href={`/thread/${thread.id}`} className="block group">
          <h3 className="font-heading font-semibold text-lg text-txt group-hover:text-gold transition-colors leading-tight">
            {thread.is_deleted ? "[deleted]" : thread.title}
          </h3>
        </Link>
        <p className="text-sm text-txt-muted mt-1.5 line-clamp-2 leading-relaxed">
          {thread.is_deleted ? "[deleted]" : thread.content}
        </p>
        <div className="flex items-center gap-4 mt-3 text-xs text-txt-muted font-mono">
          {!thread.is_deleted ? (
            <Link href={`/profile/${thread.author.username}`} className="hover:text-gold transition-colors">
              @{thread.author.username}
            </Link>
          ) : (
            <span>[deleted]</span>
          )}
          <span>{timeAgo}</span>
          <span>{thread.reply_count} {thread.reply_count === 1 ? "reply" : "replies"}</span>
          {isAuthor && !thread.is_deleted && (
            <button onClick={handleDelete} className="text-down hover:text-down/80 transition-colors">
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
