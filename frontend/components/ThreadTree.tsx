"use client";

import { useState } from "react";
import Link from "next/link";
import type { ThreadTree as ThreadTreeType } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { threadsApi } from "@/lib/api";
import VoteButtons from "./VoteButtons";
import { formatRelativeTime } from "@/lib/utils";

interface Props {
  thread: ThreadTreeType;
  depth?: number;
  onReply?: (parentId: string) => void;
  onDeleted?: () => void;
}

export default function ThreadTree({ thread, depth = 0, onReply, onDeleted }: Props) {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const timeAgo = formatRelativeTime(thread.created_at);
  const isAuthor = user?.id === thread.author.id;

  const depthColors = ["border-gold/40", "border-gold/25", "border-gold/15", "border-border"];
  const borderColor = depthColors[Math.min(depth, depthColors.length - 1)];

  const handleDelete = async () => {
    if (!confirm("Delete this?")) return;
    try {
      await threadsApi.delete(thread.id);
      setDeleted(true);
      onDeleted?.();
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (deleted) {
    return (
      <div className={depth > 0 ? `ml-4 pl-4 border-l-2 ${borderColor}` : ""}>
        <div className="py-3 text-txt-muted text-sm font-mono italic">[deleted]</div>
      </div>
    );
  }

  return (
    <div className={depth > 0 ? `ml-4 pl-4 border-l-2 ${borderColor}` : ""}>
      <div className="py-3">
        <div className="flex gap-3">
          {!thread.is_deleted && (
            <VoteButtons
  threadId={thread.id}
  initialScore={thread.vote_info?.score ?? 0}
  initialVote={thread.vote_info?.user_vote ?? 0}
/>
          )}
          <div className="flex-1 min-w-0">
            {depth === 0 && thread.title && (
              <h2 className="font-heading font-bold text-xl text-txt mb-2">
                {thread.is_deleted ? "[deleted]" : thread.title}
              </h2>
            )}
            <div className={`text-txt text-[15px] leading-relaxed whitespace-pre-wrap break-words ${thread.is_deleted ? "italic text-txt-muted" : ""}`}>
              {thread.is_deleted ? "[deleted]" : thread.content}
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-txt-muted font-mono">
              {!thread.is_deleted ? (
                <Link href={`/profile/${thread.author.username}`} className="hover:text-gold transition-colors">
                  @{thread.author.username}
                </Link>
              ) : (
                <span>[deleted]</span>
              )}
              <span>{timeAgo}</span>
              {!thread.is_deleted && (
                <button onClick={() => onReply?.(thread.id)} className="hover:text-gold transition-colors">
                  Reply
                </button>
              )}
              {isAuthor && !thread.is_deleted && (
                <button onClick={handleDelete} className="text-down hover:text-down/80 transition-colors">
                  Delete
                </button>
              )}
              {thread.children.length > 0 && (
                <button onClick={() => setCollapsed(!collapsed)} className="hover:text-gold transition-colors">
                  {collapsed ? `Show ${thread.children.length} replies` : "Collapse"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {!collapsed && thread.children.length > 0 && (
        <div className="space-y-0">
          {thread.children.map((child) => (
            <ThreadTree key={child.id} thread={child} depth={depth + 1} onReply={onReply} onDeleted={onDeleted} />
          ))}
        </div>
      )}
    </div>
  );
}
