"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MessageSquare, Clock } from "lucide-react";
import VoteButtons from "./VoteButtons";

interface ThreadCardProps {
  thread: any;
  index?: number;
}

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
  });
}

export default function ThreadCard({ thread, index = 0 }: ThreadCardProps) {
  const contentPreview = thread.content
    ? thread.content.length > 160
      ? thread.content.slice(0, 160) + "..."
      : thread.content
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: index * 0.05,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      <Link href={`/thread/${thread.id}`}>
        <article className="card-interactive group">
          <div className="flex gap-3">
            {/* Vote Buttons */}
            <div
              className="shrink-0"
              onClick={(e) => e.preventDefault()}
            >
              <VoteButtons
                threadId={thread.id}
                initialScore={thread.score ?? 0}
                initialVote={thread.user_vote ?? 0}
                compact
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Meta */}
              <div className="flex items-center gap-2 mb-2 text-xs text-txt-muted">
                <div className="w-5 h-5 bg-surface-3 rounded-full flex items-center justify-center border border-border">
                  <span className="text-[10px] font-bold text-gold">
                    {thread.author?.username?.[0]?.toUpperCase() || "?"}
                  </span>
                </div>
                <span className="font-medium text-txt-faint">
                  {thread.author?.username || "unknown"}
                </span>
                {thread.tribe && (
                  <>
                    <span className="text-txt-faint">in</span>
                    <span className="text-gold font-medium">
                      t/{thread.tribe.name}
                    </span>
                  </>
                )}
                <span className="text-txt-faint flex items-center gap-1">
                  <Clock size={10} />
                  {timeAgo(thread.created_at)}
                </span>
              </div>

              {/* Title */}
              <h3 className="font-heading font-semibold text-base text-txt group-hover:text-gold transition-colors duration-200 mb-1.5 line-clamp-2">
                {thread.title}
              </h3>

              {/* Preview */}
              {contentPreview && (
                <p className="text-sm text-txt-muted leading-relaxed line-clamp-2 mb-3">
                  {contentPreview}
                </p>
              )}

              {/* Footer */}
              <div className="flex items-center gap-4 text-xs text-txt-faint">
                <span className="flex items-center gap-1.5">
                  <MessageSquare size={13} />
                  {thread.comment_count ?? 0} replies
                </span>
              </div>
            </div>
          </div>
        </article>
      </Link>
    </motion.div>
  );
}