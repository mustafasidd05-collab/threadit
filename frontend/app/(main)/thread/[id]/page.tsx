"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { threadsApi } from "@/lib/api";
import type { ThreadTree as ThreadTreeType } from "@/lib/types";
import ThreadTreeComponent from "@/components/ThreadTree";
import CreateThreadForm from "@/components/CreateThreadForm";

export default function ThreadDetailPage() {
  const params = useParams();
  const threadId = params.id as string;
  const [thread, setThread] = useState<ThreadTreeType | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

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

  const handleReplySuccess = () => {
    setReplyingTo(null);
    loadThread();
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="card animate-pulse h-48" />
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
      <ThreadTreeComponent thread={thread} onReply={handleReply} />

      {replyingTo && (
        <div className="mt-6 fade-up">
          <p className="text-xs font-mono text-gold mb-2">
            Replying to {replyingTo === thread.id ? "thread" : "comment"}
          </p>
          <CreateThreadForm
            parentThreadId={replyingTo}
            onSuccess={handleReplySuccess}
            compact
          />
        </div>
      )}

      {!replyingTo && (
        <div className="mt-8 pt-6 border-t border-border">
          <h3 className="font-heading font-semibold text-txt mb-4">
            Leave a reply
          </h3>
          <CreateThreadForm
            parentThreadId={threadId}
            onSuccess={handleReplySuccess}
            compact
          />
        </div>
      )}
    </div>
  );
}
