"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MessageSquare, Clock, Trash2 } from "lucide-react";
import VoteButtons from "./VoteButtons";
import ContextMenu from "./ContextMenu";
import ConfirmModal from "./ConfirmModal";
import MediaRenderer from "./media/MediaRenderer";
import { threadsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";

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
  const { user } = useAuth();
  const [deleted, setDeleted] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isAuthor = user?.id === thread.author?.id;

  const contentPreview = thread.content
    ? thread.content.length > 160
      ? thread.content.slice(0, 160) + "..."
      : thread.content
    : null;

  const score = thread.vote_info?.score ?? 0;
  const userVote = thread.vote_info?.user_vote ?? 0;
  const replyCount = thread.reply_count ?? 0;
  const hasMedia = thread.media && thread.media.length > 0;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await threadsApi.delete(thread.id);
      setDeleted(true);
      setShowDeleteModal(false);
    } catch (err: any) {
      alert(err.message || "Failed to delete thread");
    } finally {
      setDeleting(false);
    }
  };

  if (deleted) return null;

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
        <article className="card-interactive group relative">
          <div className="flex gap-3">
            {/* Vote Buttons */}
            <div
              className="shrink-0"
              onClick={(e) => e.preventDefault()}
            >
              <VoteButtons
                threadId={thread.id}
                initialScore={score}
                initialVote={userVote}
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
                {thread.tribe_id && (
                  <>
                    <span className="text-txt-faint">in</span>
                    <span className="text-gold font-medium">
                      t/{thread.tribe_id}
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
                <p className="text-sm text-txt-muted leading-relaxed line-clamp-2 mb-2">
                  {contentPreview}
                </p>
              )}

              {/* Media — images AND videos rendered here */}
              {hasMedia && (
                <div className="mb-2">
                  <MediaRenderer media={thread.media} compact />
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center gap-4 text-xs text-txt-faint">
                <span className="flex items-center gap-1.5">
                  <MessageSquare size={13} />
                  {replyCount} {replyCount === 1 ? "reply" : "replies"}
                </span>
              </div>
            </div>

            {/* Three-dot menu */}
            {isAuthor && (
              <div
                className="shrink-0 self-start"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <ContextMenu
                  items={[
                    {
                      label: "Delete",
                      icon: <Trash2 size={14} />,
                      onClick: () => setShowDeleteModal(true),
                      danger: true,
                    },
                  ]}
                />
              </div>
            )}
          </div>
        </article>
      </Link>

      {/* Delete confirmation */}
      <div onClick={(e) => e.preventDefault()}>
        <ConfirmModal
          open={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          title="Delete Thread"
          message={`Delete "${thread.title}"? This cannot be undone.`}
          confirmText="Delete"
          loading={deleting}
        />
      </div>
    </motion.div>
  );
}