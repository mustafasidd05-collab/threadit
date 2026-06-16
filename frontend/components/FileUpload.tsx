"use client";

import { useState } from "react";
import { filesApi } from "@/lib/api";
import type { FileRecord } from "@/lib/types";

interface Props {
  onUpload: (file: FileRecord) => void;
}

export default function FileUpload({ onUpload }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");
    try {
      const result = await filesApi.upload(file);
      onUpload(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <label className="block">
        <span className="sr-only">Choose file</span>
        <input
          type="file"
          onChange={handleChange}
          accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt,.csv,.zip"
          className="block w-full text-sm text-txt-muted
                     file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
                     file:text-sm file:font-mono file:bg-gold/10 file:text-gold
                     hover:file:bg-gold/20 file:cursor-pointer transition-all"
        />
      </label>
      {uploading && (
        <p className="text-xs text-gold font-mono animate-pulse">
          Uploading...
        </p>
      )}
      {error && <p className="text-xs text-down">{error}</p>}
    </div>
  );
}
