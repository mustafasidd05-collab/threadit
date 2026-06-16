"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import type { Thread } from "@/lib/types";
import VoteButtons from "./VoteButtons";

interface Props {
  thread: Thread;
  index?: number;
}

export default function ThreadCard({ thread, index = 0 }: Props) {
  const timeAgo = formatDistanceToNow(new Date(thread.created_at), {
    addSuffix: true,
  });

  return (
    <div className="card flex gap-4 fade-up" style={{ animationDelay: `${index * 0.06}s` }}>
      <VoteButtons threadId={thread.id} voteInfo={thread.vote_info} />

      <div className="flex-1 min-w-0">
        <Link href={`/thread/${thread.id}`} className="block group">
          <h3 className="font-heading font-semibold text-lg text-txt group-hover:text-gold transition-colors leading-tight">
            {thread.title}
          </h3>
        </Link>
        <p className="text-sm text-txt-muted mt-1.5 line-clamp-2 leading-relaxed">
          {thread.content}
        </p>
        <div className="flex items-center gap-4 mt-3 text-xs text-txt-muted font-mono">
          <Link href={`/profile/${thread.author.username}`} className="hover:text-gold transition-colors">
            @{thread.author.username}
          </Link>
          <span>{timeAgo}</span>
          <span>
            {thread.reply_count} {thread.reply_count === 1 ? "reply" : "replies"}
          </span>
        </div>
      </div>
    </div>
  );
}
