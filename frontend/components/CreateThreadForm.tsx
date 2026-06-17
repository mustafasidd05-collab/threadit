"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { threadsApi } from "@/lib/api";

interface Props {
  parentThreadId?: string;
  tribeId?: string;
  onSuccess?: () => void;
  compact?: boolean;
}

export default function CreateThreadForm({ parentThreadId, tribeId, onSuccess, compact = false }: Props) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    if (!parentThreadId && !title.trim()) return;

    setLoading(true);
    setError("");
    try {
      const thread = await threadsApi.create({
        title: parentThreadId ? (title || "Reply") : title,
        content,
        parent_thread_id: parentThreadId,
        tribe_id: tribeId,
      });
      setTitle("");
      setContent("");
      if (onSuccess) onSuccess();
      else router.push(`/thread/${thread.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${compact ? "" : "card"}`}>
      {!compact && <h2 className="font-heading font-bold text-lg text-gold">Start a Discussion</h2>}
      {error && <p className="text-sm text-down bg-down/10 px-3 py-2 rounded-lg">{error}</p>}
      {!parentThreadId && (
        <input type="text" placeholder="Thread title" value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" required />
      )}
      <textarea
        placeholder={parentThreadId ? "Write your reply..." : "Share your thoughts..."}
        value={content} onChange={(e) => setContent(e.target.value)}
        className="input-field min-h-[120px] resize-y" required
      />
      <div className="flex justify-end">
        <button type="submit" disabled={loading} className="btn-primary text-sm">
          {loading ? "Posting..." : parentThreadId ? "Reply" : "Create Thread"}
        </button>
      </div>
    </form>
  );
}
