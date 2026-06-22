"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import ThreadMediaDisplay from "@/components/media/ThreadMediaDisplay";
import ContextMenu from "@/components/ContextMenu";
import ConfirmModal from "@/components/ConfirmModal";
import {
  ArrowLeft,
  MessageSquare,
  Share2,
  Clock,
  Reply,
  ChevronDown,
  ChevronRight,
  Loader2,
  Send,
  Trash2,
} from "lucide-react";
import { threadsApi, commentsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import VoteButtons from "@/components/VoteButtons";
import { CommentSkeleton, ThreadCardSkeleton } from "@/components/ui/Skeleton";
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
  });
}

function Comment({
  comment,
  depth = 0,
  onReply,
  onDelete,
  currentUser,
}: {
  comment: any;
  depth?: number;
  onReply: (parentId: string) => void;
  onDelete: (commentId: string) => void;
  currentUser: any;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const children = comment.children || comment.replies || [];
  const isAuthor = currentUser?.id === comment.author?.id;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      style={{ marginLeft: depth > 0 ? `${Math.min(depth * 20, 80)}px` : 0 }}
    >
      <div
        className={`py-3 ${
          depth > 0 ? "border-l-2 border-border pl-4" : ""
        }`}
      >
        <div className="flex items-center gap-2 mb-1.5">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-txt-faint hover:text-txt transition-colors"
          >
            {collapsed ? (
              <ChevronRight size={14} />
            ) : (
              <ChevronDown size={14} />
            )}
          </button>
          <div className="w-5 h-5 bg-surface-3 rounded-full flex items-center justify-center">
            <span className="text-[9px] font-bold text-gold">
              {comment.author?.username?.[0]?.toUpperCase() || "?"}
            </span>
          </div>
          <span className="text-xs font-semibold text-txt">
            {comment.author?.username || "unknown"}
          </span>
          <span className="text-xs text-txt-faint flex items-center gap-1">
            <Clock size={9} />
            {timeAgo(comment.created_at)}
          </span>
          {isAuthor && (
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
          )}
        </div>

        {!collapsed && (
          <div>
            {comment.is_deleted ? (
              <p className="text-sm text-txt-faint italic pl-7 mb-2">
                [deleted]
              </p>
            ) : (
              <>
                <p className="text-sm text-txt/90 leading-relaxed pl-7 mb-2">
                  {comment.content}
                </p>
                <button
                  onClick={() => onReply(comment.id)}
                  className="flex items-center gap-1.5 text-xs text-txt-faint hover:text-gold pl-7 transition-colors"
                >
                  <Reply size={12} />
                  Reply
                </button>
              </>
            )}
          </div>
        )}

        {!collapsed && children.length > 0 && (
          <div className="mt-1">
            {children.map((child: any) => (
              <Comment
                key={child.id}
                comment={child}
                depth={depth + 1}
                onReply={onReply}
                onDelete={onDelete}
                currentUser={currentUser}
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => {
          onDelete(comment.id);
          setShowDeleteModal(false);
        }}
        title="Delete Comment"
        message="This comment will be deleted."
        confirmText="Delete"
      />
    </motion.div>
  );
}

export default function ThreadDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [thread, setThread] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const commentFormRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const data = await threadsApi.detail(id as string);
      setThread(data);
      setComments(data.comments || data.children || []);
    } catch {
      // stay on page
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleReply = async () => {
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    setSubmitError("");
    const commentText = newComment.trim();
    const replyTarget = replyTo || (id as string);

    setNewComment("");
    setReplyTo(null);

    try {
      await threadsApi.create({
        title: commentText.slice(0, 80) || "Reply",
        content: commentText,
        parent_thread_id: replyTarget,
      });
      await load();
    } catch (err: any) {
      setNewComment(commentText);
      setReplyTo(replyTarget);
      setSubmitError(err.message || "Failed to post reply");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await commentsApi.delete(commentId);
      await load();
    } catch (err: any) {
      alert(err.message || "Failed to delete comment");
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        <ThreadCardSkeleton />
        <div className="mt-6 space-y-2">
          {[...Array(3)].map((_, i) => (
            <CommentSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!thread) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* Back button */}
      <FadeUp>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-txt-muted hover:text-gold mb-4 transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>
      </FadeUp>

      {/* Thread */}
      <FadeUp delay={0.05}>
        <div className="card mb-6">
          <div className="flex gap-4">
            <div className="shrink-0">
              <VoteButtons
                threadId={thread.id}
                initialScore={thread.vote_info?.score ?? 0}
                initialVote={thread.vote_info?.user_vote ?? 0}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3 text-xs text-txt-muted">
                <div className="w-7 h-7 bg-surface-3 rounded-full flex items-center justify-center border border-border">
                  <span className="text-[10px] font-bold text-gold">
                    {thread.author?.username?.[0]?.toUpperCase()}
                  </span>
                </div>
                <span className="font-medium text-txt">
                  {thread.author?.username}
                </span>
                {thread.tribe && (
                  <Link
                    href={`/tribe/${thread.tribe.name}`}
                    className="text-gold hover:text-gold-light transition-colors"
                  >
                    t/{thread.tribe.name}
                  </Link>
                )}
                <span className="flex items-center gap-1 text-txt-faint">
                  <Clock size={10} />
                  {timeAgo(thread.created_at)}
                </span>
              </div>

              <h1 className="font-heading font-bold text-xl md:text-2xl text-txt mb-3">
                {thread.title}
              </h1>

              {thread.content && (
                <p className="text-txt/90 leading-relaxed whitespace-pre-wrap">
                  {thread.content}
                </p>
              )}

              {thread.media && thread.media.length > 0 && (
                <div className="mt-3">
                  <ThreadMediaDisplay media={thread.media} autoPlayVideo />
                </div>
              )}

              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border">
                <span className="flex items-center gap-1.5 text-xs text-txt-muted">
                  <MessageSquare size={14} />
                  {thread.reply_count ?? comments.length} replies
                </span>
                <button className="flex items-center gap-1.5 text-xs text-txt-muted hover:text-gold transition-colors">
                  <Share2 size={14} />
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      </FadeUp>

      {/* Comment Form */}
      <FadeUp delay={0.1}>
        <div ref={commentFormRef} className="mb-6">
          {replyTo && (
            <div className="mb-2 flex items-center gap-2 text-xs text-gold">
              <Reply size={12} />
              Replying to a comment
              <button
                onClick={() => setReplyTo(null)}
                className="text-txt-faint hover:text-txt transition-colors"
              >
                (cancel)
              </button>
            </div>
          )}
          {submitError && (
            <p className="text-xs text-down mb-2">{submitError}</p>
          )}
          <div className="card">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-surface-3 rounded-full flex items-center justify-center border border-border shrink-0">
                <span className="text-xs font-bold text-gold">
                  {user?.username?.[0]?.toUpperCase() || "?"}
                </span>
              </div>
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a reply..."
                  className="input-field resize-none min-h-[60px] text-sm"
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      handleReply();
                    }
                  }}
                />
                <div className="flex justify-end mt-2">
                  <button
                    disabled={!newComment.trim() || submitting}
                    onClick={handleReply}
                    className="btn-primary flex items-center gap-1.5 text-xs"
                  >
                    {submitting ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Send size={12} />
                    )}
                    Reply
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </FadeUp>

      {/* Comments */}
      <FadeUp delay={0.15}>
        <h2 className="section-title mb-4">
          Comments ({comments.length})
        </h2>
        {comments.length === 0 ? (
          <div className="card text-center py-8">
            <MessageSquare
              size={28}
              className="text-txt-faint mx-auto mb-2"
            />
            <p className="text-txt-muted text-sm">
              No comments yet. Start the conversation!
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {comments.map((comment: any) => (
              <Comment
                key={comment.id}
                comment={comment}
                onReply={(parentId) => {
                  setReplyTo(parentId);
                  commentFormRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });
                }}
                onDelete={handleDeleteComment}
                currentUser={user}
              />
            ))}
          </div>
        )}
      </FadeUp>
    </div>
  );
}