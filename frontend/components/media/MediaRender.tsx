"use client";

import { useState } from "react";
import type { ThreadMedia } from "@/lib/types";
import ImageCarousel from "./ImageCarousel";
import VideoPlayer from "./VideoPlayer";
import FullscreenViewer from "./FullscreenViewer";
import { AnimatePresence } from "framer-motion";

interface MediaRendererProps {
  media: ThreadMedia[];
  autoPlayVideo?: boolean;
  compact?: boolean;
  onFullscreen?: (index: number) => void;
}

export default function MediaRenderer({
  media,
  autoPlayVideo = false,
  compact = false,
  onFullscreen,
}: MediaRendererProps) {
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);

  if (!media || media.length === 0) return null;

  const images = media.filter((m) => m.media_type === "image");
  const videos = media.filter((m) => m.media_type === "video");

  const handleFullscreen = (index: number) => {
    if (onFullscreen) {
      onFullscreen(index);
    } else {
      setFullscreenIndex(index);
    }
  };

  return (
    <>
      {/* Images */}
      {images.length > 0 && (
        <ImageCarousel
          media={images}
          onFullscreen={(index) => {
            const globalIdx = media.findIndex((m) => m.id === images[index].id);
            handleFullscreen(globalIdx >= 0 ? globalIdx : index);
          }}
        />
      )}

      {/* Videos */}
      {videos.map((v) => (
        <div key={v.id} onClick={(e) => e.stopPropagation()}>
          <VideoPlayer
            media={v}
            autoPlay={autoPlayVideo}
            compact={compact}
            onFullscreen={() => {
              const idx = media.findIndex((m) => m.id === v.id);
              handleFullscreen(idx >= 0 ? idx : 0);
            }}
          />
        </div>
      ))}

      {/* Fullscreen viewer */}
      {!onFullscreen && (
        <AnimatePresence>
          {fullscreenIndex !== null && (
            <FullscreenViewer
              media={media}
              initialIndex={fullscreenIndex}
              onClose={() => setFullscreenIndex(null)}
            />
          )}
        </AnimatePresence>
      )}
    </>
  );
}