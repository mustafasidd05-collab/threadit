"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { threadsApi } from "@/lib/api";
import type { ThreadTree as ThreadTreeType } from "@/lib/types";
import ThreadTreeComponent from "@/components/ThreadTree";
import CreateThreadForm from "@/components/CreateThreadForm";
import { Skeleton } from "@/components/Skeleton";
import { useAuth } from "@/lib/auth";

export default function ThreadDetailPage() {
  const params = useParams();
  const threadId = params.id as string;
  const { user } = useAuth();
  const [thread, setThread] = useState<ThreadTreeType | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  const loadThread = useCallback(async () => {
    try {
      const data = await threadsApi.detail(threadId);
      setThread(data);
    } catch {
      setThread(null);
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  useEffect(() => {
    loadThread();
  }, [loadThread]);

  const handleReply = (parentId: string) => {
    setReplyingTo(replyingTo === parentId ? null : parentId);
  };

  const handleReplySubmit = async (parentId: string, content: string, title: string) => {
    if (!user) return;
    setPosting(true);

    // Optimistic: add reply immediately
    const optimisticReply: ThreadTreeType = {
      id: `temp-${Date.now()}`,
      title: title || "Reply",
      content: content,
      author: user,
      parent_thread_id: parentId,
      tribe_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      reply_count: 0,
      vote_info: { score: 0, user_vote: null },
      is_deleted: false,
      children: [],
    };

    const addOptimistic = (node: ThreadTreeType): ThreadTreeType => {
      if (node.id === parentId) {
        return { ...node, children: [...node.children, optimisticReply] };
      }
      return { ...node, children: node.children.map(addOptimistic) };
    };

    setThread((prev) => (prev ? addOptimistic(prev) : prev));
    setReplyingTo(null);

    try {
      await threadsApi.create({
        title: title || "Reply",
        content,
        parent_thread_id: parentId,
      });
      // Refresh to get real data
      await loadThread();
    } catch {
      // Revert on failure
      await loadThread();
    } finally {
      setPosting(false);
    }
  };

  const handleDeleted = () => {
    loadThread();
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-3 w-1/3" />
        <div className="mt-6 space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-11/12 ml-6" />
          <Skeleton className="h-16 w-10/12 ml-12" />
        </div>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="card text-center py-12">
          <p className="text-txt-muted font-mono">Thread not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <ThreadTreeComponent thread={thread} onReply={handleReply} onDeleted={handleDeleted} />

      {replyingTo && (
        <div className="mt-6 fade-up">
          <p className="text-xs font-mono text-gold mb-2">
            Replying to {replyingTo === thread.id ? "thread" : "comment"}
          </p>
          <OptimisticReplyForm
            parentId={replyingTo}
            onSubmit={handleReplySubmit}
            onCancel={() => setReplyingTo(null)}
            posting={posting}
          />
        </div>
      )}

      {!replyingTo && !thread.is_deleted && (
        <div className="mt-8 pt-6 border-t border-border">
          <h3 className="font-heading font-semibold text-txt mb-4">Leave a reply</h3>
          <OptimisticReplyForm
            parentId={threadId}
            onSubmit={handleReplySubmit}
            posting={posting}
            isRoot
          />
        </div>
      )}
    </div>
  );
}

function OptimisticReplyForm({
  parentId,
  onSubmit,
  onCancel,
  posting,
  isRoot = false,
}: {
  parentId: string;
  onSubmit: (parentId: string, content: string, title: string) => Promise<void>;
  onCancel?: () => void;
  posting: boolean;
  isRoot?: boolean;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    await onSubmit(parentId, content, title);
    setTitle("");
    setContent("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {isRoot && (
        <input
          type="text"
          placeholder="Title (optional for replies)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input-field"
        />
      )}
      <textarea
        placeholder="Write your reply..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="input-field min-h-[100px] resize-y"
        required
      />
      <div className="flex gap-2 justify-end">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-ghost text-sm">Cancel</button>
        )}
        <button
          type="submit"
          disabled={posting || !content.trim()}
          className="btn-primary text-sm flex items-center gap-2"
        >
          {posting ? (
            <>
              <span className="w-3 h-3 border-2 border-base border-t-transparent rounded-full animate-spin" />
              Posting...
            </>
          ) : (
            "Reply"
          )}
        </button>
      </div>
    </form>
  );
}
