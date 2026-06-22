"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  danger?: boolean;
  requireTyping?: boolean;
  loading?: boolean;
}

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  danger = true,
  requireTyping = false,
  loading = false,
}: ConfirmModalProps) {
  const [typed, setTyped] = useState("");

  const canConfirm = !requireTyping || typed === "DELETE";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-base/80 backdrop-blur flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            onClick={(e) => e.stopPropagation()}
            className="card max-w-md w-full"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {danger && (
                  <div className="w-10 h-10 bg-down/10 rounded-xl flex items-center justify-center">
                    <AlertTriangle size={20} className="text-down" />
                  </div>
                )}
                <h3 className="font-heading font-semibold text-lg text-txt">
                  {title}
                </h3>
              </div>
              <button onClick={onClose} className="btn-icon">
                <X size={16} />
              </button>
            </div>

            <p className="text-sm text-txt-muted leading-relaxed mb-4">
              {message}
            </p>

            {requireTyping && (
              <div className="mb-4">
                <p className="text-xs text-txt-faint mb-2">
                  Type <span className="font-mono font-bold text-txt">DELETE</span> to confirm:
                </p>
                <input
                  type="text"
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  placeholder="Type DELETE"
                  className="input-field font-mono"
                  autoFocus
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button onClick={onClose} className="btn-secondary text-sm">
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={!canConfirm || loading}
                className={`btn-primary text-sm flex items-center gap-2 ${
                  danger ? "bg-down hover:bg-down/90" : ""
                }`}
              >
                {loading && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
