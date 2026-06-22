"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoreVertical, Trash2, Edit, Shield, X } from "lucide-react";

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

interface ContextMenuProps {
  items: MenuItem[];
}

export default function ContextMenu({ items }: ContextMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(!open);
        }}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-txt-faint hover:text-txt hover:bg-surface-2 transition-all"
      >
        <MoreVertical size={16} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-8 z-50 w-44 bg-surface-2 border border-border rounded-xl shadow-2xl overflow-hidden py-1"
          >
            {items.map((item, i) => (
              <button
                key={i}
                disabled={item.disabled}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpen(false);
                  item.onClick();
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                  item.danger
                    ? "text-down hover:bg-down/10"
                    : "text-txt-muted hover:text-txt hover:bg-surface-3"
                } ${item.disabled ? "opacity-40 pointer-events-none" : ""}`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
