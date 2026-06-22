"use client";

import type { ThreadMedia } from "@/lib/types";
import MediaRenderer from "./MediaRenderer";

interface ThreadMediaDisplayProps {
  media: ThreadMedia[];
  autoPlayVideo?: boolean;
}

export default function ThreadMediaDisplay({
  media,
  autoPlayVideo = false,
}: ThreadMediaDisplayProps) {
  return <MediaRenderer media={media} autoPlayVideo={autoPlayVideo} />;
}