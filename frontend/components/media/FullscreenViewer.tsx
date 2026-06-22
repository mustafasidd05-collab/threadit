"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { ThreadMedia } from "@/lib/types";

interface FullscreenViewerProps {
  media: ThreadMedia[];
  initialIndex: number;
  onClose: () => void;
}

export default function FullscreenViewer({
  media,
  initialIndex,
  onClose,
}: FullscreenViewerProps) {
  const [current, setCurrent] = useState(initialIndex);

  const next = useCallback(() => {
    if (current < media.length - 1) setCurrent(current + 1);
  }, [current, media.length]);

  const prev = useCallback(() => {
    if (current > 0) setCurrent(current - 1);
  }, [current]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose, next, prev]);

  const item = media[current];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-base/95 backdrop-blur flex items-center justify-center"
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 bg-surface-2/80 backdrop-blur rounded-full flex items-center justify-center text-txt hover:text-gold transition-colors z-50"
      >
        <X size={20} />
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-4 font-mono text-sm text-txt-muted z-50">
        {current + 1} / {media.length}
      </div>

      {/* Previous */}
      {current > 0 && (
        <button
          onClick={prev}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-surface-2/80 backdrop-blur rounded-full flex items-center justify-center text-txt hover:text-gold transition-colors z-50"
        >
          <ChevronLeft size={20} />
        </button>
      )}

      {/* Next */}
      {current < media.length - 1 && (
        <button
          onClick={next}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-surface-2/80 backdrop-blur rounded-full flex items-center justify-center text-txt hover:text-gold transition-colors z-50"
        >
          <ChevronRight size={20} />
        </button>
      )}

      {/* Media */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="max-w-[90vw] max-h-[85vh] flex items-center justify-center"
        >
          {item.media_type === "video" ? (
            <video
              src={item.url}
              controls
              autoPlay
              className="max-w-full max-h-[85vh] rounded-lg"
            />
          ) : (
            <img
              src={item.url}
              alt={item.caption || ""}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Caption */}
      {item.caption && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-surface-2/80 backdrop-blur px-4 py-2 rounded-xl">
          <p className="text-sm text-txt text-center max-w-md">
            {item.caption}
          </p>
        </div>
      )}
    </motion.div>
  );
}