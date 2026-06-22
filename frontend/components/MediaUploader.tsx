"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Image as ImageIcon,
  Video,
  X,
  Upload,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { uploadToSanity, type UploadedAsset } from "@/sanity/upload";

const ALLOWED_VIDEO = ["video/mp4", "video/webm", "video/quicktime"];
const ALLOWED_IMAGE = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

interface MediaFile {
  id: string;
  file: File;
  preview: string;
  uploading: boolean;
  progress: number;
  uploaded: UploadedAsset | null;
  error: string;
  mediaType: "image" | "video";
  duration?: number;
}

interface MediaUploaderProps {
  onMediaChange: (media: UploadedAsset[]) => void;
  maxFiles?: number;
}

export default function MediaUploader({
  onMediaChange,
  maxFiles = 10,
}: MediaUploaderProps) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const updateParent = useCallback(
    (updatedFiles: MediaFile[]) => {
      const uploaded = updatedFiles
        .filter((f) => f.uploaded)
        .map((f) => f.uploaded!);
      onMediaChange(uploaded);
    },
    [onMediaChange]
  );

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File too large (max 100MB)`;
    }
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    if (isVideo && !ALLOWED_VIDEO.includes(file.type)) {
      return `Unsupported video format. Use MP4, WebM, or MOV.`;
    }
    if (isImage && !ALLOWED_IMAGE.includes(file.type)) {
      return `Unsupported image format.`;
    }
    if (!isVideo && !isImage) {
      return `Only images and videos are allowed.`;
    }
    return null;
  };

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        resolve(Math.round(video.duration));
        URL.revokeObjectURL(video.src);
      };
      video.onerror = () => resolve(0);
      video.src = URL.createObjectURL(file);
    });
  };

  const addFiles = useCallback(
    async (newFiles: FileList | File[]) => {
      const remaining = maxFiles - files.length;
      const toAdd = Array.from(newFiles).slice(0, remaining);

      const mediaFiles: MediaFile[] = [];

      for (const file of toAdd) {
        const error = validateFile(file);
        const isVideo = file.type.startsWith("video/");
        const preview = URL.createObjectURL(file);
        let duration: number | undefined;

        if (isVideo) {
          duration = await getVideoDuration(file);
        }

        mediaFiles.push({
          id: Math.random().toString(36).slice(2),
          file,
          preview,
          uploading: !error,
          progress: 0,
          uploaded: null,
          error: error || "",
          mediaType: isVideo ? "video" : "image",
          duration,
        });
      }

      setFiles((prev) => [...prev, ...mediaFiles]);

      // Upload valid files
      for (const mf of mediaFiles) {
        if (mf.error) continue;

        try {
          setFiles((prev) =>
            prev.map((f) => (f.id === mf.id ? { ...f, progress: 10 } : f))
          );

          const asset = await uploadToSanity(mf.file, (percent) => {
            setFiles((prev) =>
              prev.map((f) => (f.id === mf.id ? { ...f, progress: percent } : f))
            );
          });

          // Add duration to video assets
          if (mf.mediaType === "video" && mf.duration) {
            asset.duration = mf.duration;
          }

          setFiles((prev) => {
            const updated = prev.map((f) =>
              f.id === mf.id
                ? { ...f, uploading: false, progress: 100, uploaded: asset }
                : f
            );
            updateParent(updated);
            return updated;
          });
        } catch (err: any) {
          const msg =
            typeof err === "string"
              ? err
              : err?.message || "Upload failed";
          setFiles((prev) =>
            prev.map((f) =>
              f.id === mf.id ? { ...f, uploading: false, error: msg } : f
            )
          );
        }
      }
    },
    [files.length, maxFiles, updateParent]
  );

  const removeFile = useCallback(
    (id: string) => {
      setFiles((prev) => {
        const file = prev.find((f) => f.id === id);
        if (file?.preview) URL.revokeObjectURL(file.preview);
        const updated = prev.filter((f) => f.id !== id);
        updateParent(updated);
        return updated;
      });
    },
    [updateParent]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-3">
      {/* Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
          dragOver
            ? "border-gold bg-gold/5"
            : "border-border hover:border-border-light"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <Upload
          size={24}
          className={`mx-auto mb-2 ${dragOver ? "text-gold" : "text-txt-faint"}`}
        />
        <p className="text-sm text-txt-muted">
          Drag and drop images or videos here
        </p>
        <div className="flex items-center justify-center gap-3 mt-2 text-xs text-txt-faint">
          <span className="flex items-center gap-1">
            <ImageIcon size={12} /> JPG, PNG, GIF, WebP
          </span>
          <span className="text-border">|</span>
          <span className="flex items-center gap-1">
            <Video size={12} /> MP4, WebM, MOV
          </span>
        </div>
        <p className="text-xs text-txt-faint mt-1">
          Max 100MB per file ({files.length}/{maxFiles})
        </p>
      </div>

      {/* Preview Grid */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-2 sm:grid-cols-3 gap-2"
          >
            {files.map((mf) => (
              <motion.div
                key={mf.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative aspect-square rounded-xl overflow-hidden bg-surface-2 border border-border group"
              >
                {mf.mediaType === "video" ? (
                  <video
                    src={mf.preview}
                    className="w-full h-full object-cover"
                    muted
                  />
                ) : (
                  <img
                    src={mf.preview}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Upload progress overlay */}
                {mf.uploading && (
                  <div className="absolute inset-0 bg-base/60 flex items-center justify-center">
                    <div className="text-center">
                      <Loader2
                        size={24}
                        className="animate-spin text-gold mx-auto"
                      />
                      <p className="text-xs text-txt mt-1 font-mono">
                        {mf.progress}%
                      </p>
                    </div>
                  </div>
                )}

                {/* Error */}
                {mf.error && (
                  <div className="absolute inset-0 bg-base/70 flex items-center justify-center p-2">
                    <div className="text-center">
                      <AlertCircle
                        size={20}
                        className="text-down mx-auto mb-1"
                      />
                      <p className="text-[10px] text-down leading-tight">
                        {mf.error}
                      </p>
                    </div>
                  </div>
                )}

                {/* Type badge */}
                <div className="absolute top-1.5 left-1.5">
                  {mf.mediaType === "video" ? (
                    <span className="badge bg-base/80 text-txt text-[10px]">
                      <Video size={9} className="mr-0.5" />
                      {mf.duration ? formatDuration(mf.duration) : "Video"}
                    </span>
                  ) : (
                    <span className="badge bg-base/80 text-txt text-[10px]">
                      <ImageIcon size={9} className="mr-0.5" />
                      Image
                    </span>
                  )}
                </div>

                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(mf.id);
                  }}
                  className="absolute top-1.5 right-1.5 w-6 h-6 bg-base/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-down/80 hover:text-white"
                >
                  <X size={12} />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}