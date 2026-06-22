"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import type { ThreadMedia } from "@/lib/types";
import MediaCarousel from "./MediaCarousel";
import FullscreenViewer from "./FullscreenViewer";

interface MediaRendererProps {
  media: ThreadMedia[];
  autoPlayVideo?: boolean;
  compact?: boolean;
}

export default function MediaRenderer({
  media,
  autoPlayVideo = false,
  compact = false,
}: MediaRendererProps) {
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);

  if (!media || media.length === 0) return null;

  return (
    <>
      <MediaCarousel
        media={media}
        autoPlayVideo={autoPlayVideo}
        compact={compact}
        onFullscreen={(index) => setFullscreenIndex(index)}
      />

      <AnimatePresence>
        {fullscreenIndex !== null && (
          <FullscreenViewer
            media={media}
            initialIndex={fullscreenIndex}
            onClose={() => setFullscreenIndex(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}