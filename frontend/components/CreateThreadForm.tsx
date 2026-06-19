"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Send, Loader2 } from "lucide-react";
import { threadsApi } from "@/lib/api";

interface CreateThreadFormProps {
  tribeId?: string;
  onCreated?: () => void;
}

export default function CreateThreadForm({
  tribeId,
  onCreated,
}: CreateThreadFormProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setError("");
    try {
      await threadsApi.create({
        title: title.trim(),
        content: content.trim(),
        tribe_id: tribeId,
      });
      setTitle("");
      setContent("");
      setOpen(false);
      onCreated?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6">
      <AnimatePresence mode="wait">
        {!open ? (
          <motion.button
            key="trigger"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={() => setOpen(true)}
            className="card w-full flex items-center gap-3 text-left group cursor-pointer hover:border-border-light transition-all duration-200"
          >
            <div className="w-9 h-9 bg-gold/10 rounded-xl flex items-center justify-center group-hover:bg-gold/20 transition-colors">
              <Plus size={18} className="text-gold" />
            </div>
            <span className="text-txt-muted text-sm">
              Start a new conversation...
            </span>
          </motion.button>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <form onSubmit={handleSubmit} className="card space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-semibold text-base text-txt">
                  New Thread
                </h3>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="btn-icon"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Title */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="An interesting title..."
                  className="input-field font-heading font-semibold text-lg"
                  autoFocus
                  maxLength={200}
                  required
                />
              </motion.div>

              {/* Content */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Share your thoughts... (optional)"
                  className="input-field resize-none min-h-[120px]"
                  rows={4}
                />
              </motion.div>

              {/* Error */}
              {error && (
                <p className="text-sm text-down bg-down/10 px-3 py-2 rounded-lg">
                  {error}
                </p>
              )}

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center justify-between pt-1"
              >
                <p className="text-xs text-txt-faint font-mono">
                  {title.length}/200
                </p>
                <button
                  type="submit"
                  disabled={loading || !title.trim()}
                  className="btn-primary flex items-center gap-2"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                  Post Thread
                </button>
              </motion.div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}