"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import type { ThreadMedia } from "@/lib/types";

interface ImageCarouselProps {
  media: ThreadMedia[];
  onFullscreen?: (index: number) => void;
}

export default function ImageCarousel({
  media,
  onFullscreen,
}: ImageCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const touchStartX = useRef(0);

  if (media.length === 0) return null;

  const goTo = (index: number) => {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
  };

  const next = () => {
    if (current < media.length - 1) goTo(current + 1);
  };

  const prev = () => {
    if (current > 0) goTo(current - 1);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) next();
      else prev();
    }
  };

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({
      x: dir > 0 ? -300 : 300,
      opacity: 0,
    }),
  };

  return (
    <div
      className="relative rounded-xl overflow-hidden bg-surface-2 group"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="aspect-video relative overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.img
            key={current}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            src={media[current].url}
            alt={media[current].caption || ""}
            className="w-full h-full object-contain absolute inset-0"
          />
        </AnimatePresence>
      </div>

      {/* Navigation arrows */}
      {media.length > 1 && (
        <>
          {current > 0 && (
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-base/70 backdrop-blur rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-txt hover:bg-base/90"
            >
              <ChevronLeft size={18} />
            </button>
          )}
          {current < media.length - 1 && (
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-base/70 backdrop-blur rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-txt hover:bg-base/90"
            >
              <ChevronRight size={18} />
            </button>
          )}
        </>
      )}

      {/* Counter */}
      {media.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 badge bg-base/80 backdrop-blur text-txt font-mono text-xs">
          {current + 1} / {media.length}
        </div>
      )}

      {/* Fullscreen button */}
      {onFullscreen && (
        <button
          onClick={() => onFullscreen(current)}
          className="absolute top-3 right-3 w-8 h-8 bg-base/70 backdrop-blur rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-txt hover:bg-base/90"
        >
          <Maximize2 size={14} />
        </button>
      )}

      {/* Dots */}
      {media.length > 1 && media.length <= 7 && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-1.5">
          {media.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                i === current
                  ? "bg-gold w-4"
                  : "bg-txt-faint/50 w-1.5 hover:bg-txt-faint"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}