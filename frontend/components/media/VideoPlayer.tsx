"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  SkipBack,
  SkipForward,
} from "lucide-react";
import type { ThreadMedia } from "@/lib/types";

interface VideoPlayerProps {
  media: ThreadMedia;
  autoPlay?: boolean;
  compact?: boolean;
  onFullscreen?: () => void;
  onRegister?: (el: HTMLVideoElement | null) => void;
}

export default function VideoPlayer({
  media,
  autoPlay = false,
  compact = false,
  onFullscreen,
  onRegister,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(!compact);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [skipIndicator, setSkipIndicator] = useState<"-" | "+" | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const controlsTimeout = useRef<NodeJS.Timeout>();

  // Register video element with parent carousel
  useEffect(() => {
    onRegister?.(videoRef.current);
    return () => onRegister?.(null);
  }, [onRegister]);

  // Start muted
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = true;
      video.volume = 1;
    }
  }, []);

  // Sync muted/volume state to DOM
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = muted;
      if (!muted) video.volume = volume;
    }
  }, [muted, volume]);

  // Autoplay when visible (only if autoPlay is true)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !autoPlay) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().catch(() => {});
            setPlaying(true);
            setHasInteracted(true);
          } else {
            video.pause();
            setPlaying(false);
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [autoPlay]);

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 3000);
  }, [playing]);

  const togglePlay = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }

    setHasInteracted(true);
    setShowPlayIcon(true);
    setTimeout(() => setShowPlayIcon(false), 500);
  }, []);

  const toggleMute = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  }, []);

  const handleVolumeChange = useCallback((value: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = value;
    setVolume(value);
    if (value === 0) {
      video.muted = true;
      setMuted(true);
    } else if (video.muted) {
      video.muted = false;
      setMuted(false);
    }
  }, []);

  const skip = useCallback((seconds: number, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(
      0,
      Math.min(video.duration || 0, video.currentTime + seconds)
    );
    setSkipIndicator(seconds > 0 ? "+" : "-");
    setTimeout(() => setSkipIndicator(null), 600);
  }, []);

  const toggleFullscreen = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (onFullscreen) {
      onFullscreen();
      return;
    }
    const container = containerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, [onFullscreen]);

  const seekTo = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Number(e.target.value);
  }, []);

  const handleMouseMove = useCallback(() => {
    if (compact) showControlsTemporarily();
  }, [compact, showControlsTemporarily]);

  const formatTime = (sec: number) => {
    if (!sec || isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full group cursor-pointer bg-black ${
        isFullscreen
          ? "flex items-center justify-center w-screen h-screen"
          : ""
      }`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => compact && setShowControls(true)}
      onMouseLeave={() => {
        if (compact && playing) {
          controlsTimeout.current = setTimeout(
            () => setShowControls(false),
            1000
          );
        }
      }}
    >
      <video
        ref={videoRef}
        src={media.url}
        poster={media.thumbnail_url}
        loop
        playsInline
        preload={compact ? "none" : "metadata"}
        className={`${
          isFullscreen ? "max-w-full max-h-full" : "w-full h-full"
        } object-contain`}
        onClick={togglePlay}
        onTimeUpdate={() => {
          setCurrentTime(videoRef.current?.currentTime || 0);
          const video = videoRef.current;
          if (video && video.buffered.length > 0) {
            setBuffered(video.buffered.end(video.buffered.length - 1));
          }
        }}
        onLoadedMetadata={() => {
          setDuration(videoRef.current?.duration || 0);
        }}
        onEnded={() => setPlaying(false)}
      />

      {/* Center play/pause animation */}
      <AnimatePresence>
        {showPlayIcon && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.3 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
          >
            <div className="w-14 h-14 bg-base/50 backdrop-blur rounded-full flex items-center justify-center">
              {playing ? (
                <Pause size={24} className="text-txt" />
              ) : (
                <Play size={24} className="text-txt ml-0.5" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skip indicator */}
      <AnimatePresence>
        {skipIndicator && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.2, y: -10 }}
            transition={{ duration: 0.3 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
          >
            <span className="text-xl font-bold text-txt font-mono bg-base/50 px-3 py-1.5 rounded-xl backdrop-blur">
              {skipIndicator}10s
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Big play button when paused */}
      {!playing && !hasInteracted && (
        <div
          className="absolute inset-0 flex items-center justify-center z-10"
          onClick={togglePlay}
        >
          <div className="w-14 h-14 bg-base/40 backdrop-blur rounded-full flex items-center justify-center hover:bg-base/60 transition-colors">
            <Play size={24} className="text-txt ml-1" />
          </div>
        </div>
      )}

      {/* Skip zones */}
      <div
        className="absolute left-0 top-0 w-1/3 h-full z-10"
        onClick={(e) => skip(-10, e)}
      />
      <div
        className="absolute right-0 top-0 w-1/3 h-full z-10"
        onClick={(e) => skip(10, e)}
      />

      {/* Bottom controls */}
      <motion.div
        initial={false}
        animate={{ opacity: showControls || !playing ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="absolute bottom-0 left-0 right-0 z-30"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-t from-base/80 via-base/40 to-transparent pt-6 pb-2 px-3">
          {/* Progress bar */}
          <div className="relative w-full h-1 mb-1.5 group/progress">
            <div className="absolute inset-0 h-full bg-txt-faint/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-txt-faint/30 rounded-full"
                style={{
                  width: duration ? `${(buffered / duration) * 100}%` : "0%",
                }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={currentTime}
              onChange={seekTo}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div
              className="absolute left-0 top-0 h-full bg-gold rounded-full pointer-events-none"
              style={{ width: `${progressPercent}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-gold rounded-full pointer-events-none opacity-0 group-hover/progress:opacity-100 transition-opacity shadow-lg"
              style={{ left: `calc(${progressPercent}% - 5px)` }}
            />
          </div>

          {/* Controls row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <button onClick={togglePlay} className="text-txt hover:text-gold transition-colors p-0.5">
                {playing ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button onClick={(e) => skip(-10, e)} className="text-txt/60 hover:text-gold transition-colors p-0.5">
                <SkipBack size={13} />
              </button>
              <button onClick={(e) => skip(10, e)} className="text-txt/60 hover:text-gold transition-colors p-0.5">
                <SkipForward size={13} />
              </button>

              {/* Volume */}
              <div
                className="relative flex items-center gap-0.5"
                onMouseEnter={() => setShowVolumeSlider(true)}
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                <button onClick={toggleMute} className="text-txt/60 hover:text-gold transition-colors p-0.5">
                  {muted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>
                <AnimatePresence>
                  {showVolumeSlider && (
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 60, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden"
                    >
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={muted ? 0 : volume}
                        onChange={(e) => handleVolumeChange(Number(e.target.value))}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="w-full h-1 accent-gold cursor-pointer"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <span className="text-[10px] font-mono text-txt/60 ml-1">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <button onClick={toggleFullscreen} className="text-txt/60 hover:text-gold transition-colors p-0.5">
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Top-right mute button */}
      <button
        onClick={toggleMute}
        className="absolute top-2 right-2 w-7 h-7 bg-base/50 backdrop-blur rounded-lg flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-opacity text-txt hover:bg-base/80"
      >
        {muted || volume === 0 ? <VolumeX size={12} /> : <Volume2 size={12} />}
      </button>

      {/* Duration badge (compact, before interaction) */}
      {compact && !hasInteracted && duration > 0 && (
        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-base/70 backdrop-blur rounded text-[10px] font-mono text-txt z-10">
          {formatTime(duration)}
        </div>
      )}
    </div>
  );
}