"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import type { ThreadTree as ThreadTreeType } from "@/lib/types";
import VoteButtons from "./VoteButtons";

interface Props {
  thread: ThreadTreeType;
  depth?: number;
  onReply?: (parentId: string) => void;
}

export default function ThreadTree({ thread, depth = 0, onReply }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const timeAgo = formatDistanceToNow(new Date(thread.created_at), {
    addSuffix: true,
  });

  const depthColors = [
    "border-gold/40",
    "border-gold/25",
    "border-gold/15",
    "border-border",
  ];
  const borderColor = depthColors[Math.min(depth, depthColors.length - 1)];

  return (
    <div className={depth > 0 ? `ml-4 pl-4 border-l-2 ${borderColor}` : ""}>
      <div className="py-3">
        <div className="flex gap-3">
          <VoteButtons threadId={thread.id} voteInfo={thread.vote_info} />
          <div className="flex-1 min-w-0">
            {depth === 0 && thread.title && (
              <h2 className="font-heading font-bold text-xl text-txt mb-2">
                {thread.title}
              </h2>
            )}
            <div className="text-txt text-[15px] leading-relaxed whitespace-pre-wrap break-words">
              {thread.content}
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-txt-muted font-mono">
              <Link
                href={`/profile/${thread.author.username}`}
                className="hover:text-gold transition-colors"
              >
                @{thread.author.username}
              </Link>
              <span>{timeAgo}</span>
              <button
                onClick={() => onReply?.(thread.id)}
                className="hover:text-gold transition-colors"
              >
                Reply
              </button>
              {thread.children.length > 0 && (
                <button
                  onClick={() => setCollapsed(!collapsed)}
                  className="hover:text-gold transition-colors"
                >
                  {collapsed
                    ? `Show ${thread.children.length} replies`
                    : "Collapse"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {!collapsed && thread.children.length > 0 && (
        <div className="space-y-0">
          {thread.children.map((child) => (
            <ThreadTree
              key={child.id}
              thread={child}
              depth={depth + 1}
              onReply={onReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}
