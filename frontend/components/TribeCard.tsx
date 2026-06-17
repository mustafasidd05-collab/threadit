"use client";

import Link from "next/link";
import type { Tribe } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";

interface Props {
  tribe: Tribe;
  onJoinLeave?: () => void;
}

export default function TribeCard({ tribe, onJoinLeave }: Props) {
  return (
    <div className="card flex items-center justify-between gap-4">
      <div className="min-w-0">
        <Link href={`/tribe/${tribe.name}`} className="group">
          <h3 className="font-heading font-semibold text-lg text-txt group-hover:text-gold transition-colors">
            t/{tribe.name}
          </h3>
        </Link>
        <p className="text-sm text-txt-muted mt-1 line-clamp-2">{tribe.description}</p>
        <div className="flex items-center gap-3 mt-2 text-xs text-txt-muted font-mono">
          <span>{tribe.member_count} member{tribe.member_count !== 1 ? "s" : ""}</span>
          <span>Created {formatRelativeTime(tribe.created_at)}</span>
        </div>
      </div>
      {onJoinLeave && (
        <button
          onClick={onJoinLeave}
          className={tribe.is_member ? "btn-secondary text-xs whitespace-nowrap" : "btn-primary text-xs whitespace-nowrap"}
        >
          {tribe.is_member ? "Leave" : "Join"}
        </button>
      )}
    </div>
  );
}
