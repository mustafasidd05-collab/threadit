"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
} from "lucide-react";
import type { ThreadMedia } from "@/lib/types";
import VideoPlayer from "./VideoPlayer";

interface MediaCarouselProps {
  media: ThreadMedia[];
  autoPlayVideo?: boolean;
  compact?: boolean;
  onFullscreen?: (index: number) => void;
}

export default function MediaCarousel({
  media,
  autoPlayVideo = false,
  compact = false,
  onFullscreen,
}: MediaCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const dragStartX = useRef(0);
  const isHorizontalDrag = useRef<boolean | null>(null);

  const total = media.length;
  if (total === 0) return null;

  const currentItem = media[current];

  const goTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= total || index === current) return;
      // Pause current video if it's a video
      const videoEl = videoRefs.current.get(current);
      if (videoEl && !videoEl.paused) {
        videoEl.pause();
      }
      setDirection(index > current ? 1 : -1);
      setCurrent(index);
    },
    [current, total]
  );

  const next = useCallback(() => goTo(current + 1), [goTo, current]);
  const prev = useCallback(() => goTo(current - 1), [goTo, current]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [prev, next]);

  // Touch handlers (mobile swipe)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isHorizontalDrag.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;

    // Determine direction on first significant move
    if (isHorizontalDrag.current === null && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
      isHorizontalDrag.current = Math.abs(dx) > Math.abs(dy);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isHorizontalDrag.current === false) return; // vertical scroll, ignore
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) {
      if (dx < 0) next();
      else prev();
    }
  };

  // Mouse drag handlers (desktop)
  const handleMouseDown = (e: React.MouseEvent) => {
    // Don't start drag on interactive elements
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("input") || target.closest("a")) return;
    dragStartX.current = e.clientX;
    setIsDragging(true);
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartX.current;
      if (Math.abs(dx) > 100) {
        if (dx < 0) next();
        else prev();
        setIsDragging(false);
      }
    },
    [isDragging, next, prev]
  );

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Register video element for pause control
  const registerVideo = useCallback((index: number, el: HTMLVideoElement | null) => {
    if (el) {
      videoRefs.current.set(index, el);
    } else {
      videoRefs.current.delete(index);
    }
  }, []);

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -300 : 300,
      opacity: 0,
    }),
  };

  return (
    <div
      ref={containerRef}
      className="relative rounded-xl overflow-hidden bg-surface-2 group select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: isDragging ? "grabbing" : "grab" }}
    >
      {/* Media viewport */}
      <div className="aspect-video relative overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={current}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="absolute inset-0"
          >
            {currentItem.media_type === "video" ? (
              <VideoPlayer
                media={currentItem}
                autoPlay={autoPlayVideo}
                compact={compact}
                onRegister={(el) => registerVideo(current, el)}
                onFullscreen={onFullscreen ? () => onFullscreen(current) : undefined}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-surface-2">
                <img
                  src={currentItem.url}
                  alt={currentItem.caption || ""}
                  className="max-w-full max-h-full object-contain"
                  draggable={false}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation arrows (only if multiple items) */}
      {total > 1 && (
        <>
          {current > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-base/70 backdrop-blur rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-txt hover:bg-base/90 z-30"
            >
              <ChevronLeft size={18} />
            </button>
          )}
          {current < total - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-base/70 backdrop-blur rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-txt hover:bg-base/90 z-30"
            >
              <ChevronRight size={18} />
            </button>
          )}
        </>
      )}

      {/* Counter badge */}
      {total > 1 && (
        <div className="absolute top-3 left-3 z-30">
          <span className="badge bg-base/80 backdrop-blur text-txt font-mono text-xs">
            {current + 1} / {total}
          </span>
        </div>
      )}

      {/* Fullscreen button */}
      {onFullscreen && currentItem.media_type === "image" && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFullscreen(current);
          }}
          className="absolute top-3 right-3 w-8 h-8 bg-base/70 backdrop-blur rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-txt hover:bg-base/90 z-30"
        >
          <Maximize2 size={14} />
        </button>
      )}

      {/* Dots indicator */}
      {total > 1 && total <= 7 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-30">
          {media.map((item, i) => (
            <button
              key={item.id}
              onClick={(e) => {
                e.stopPropagation();
                goTo(i);
              }}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                i === current
                  ? "bg-gold w-4"
                  : "bg-txt-faint/50 w-1.5 hover:bg-txt-faint"
              } ${item.media_type === "video" ? "!rounded-sm" : ""}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}