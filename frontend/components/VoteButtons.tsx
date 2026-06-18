"use client";

import { threadsApi } from "@/lib/api";
import { useState } from "react";
import type { VoteInfo } from "@/lib/types";

interface Props {
  threadId: string;
  voteInfo: VoteInfo;
  onVoteChange?: (info: VoteInfo) => void;
}

export default function VoteButtons({ threadId, voteInfo, onVoteChange }: Props) {
  const [info, setInfo] = useState(voteInfo);
  const [loading, setLoading] = useState(false);

  const vote = async (value: number) => {
    const newValue = info.user_vote === value ? 0 : value;

    // Optimistic update
    const prevInfo = { ...info };
    const optimisticScore =
      info.score - (info.user_vote || 0) + newValue;
    const optimisticInfo: VoteInfo = {
      score: optimisticScore,
      user_vote: newValue === 0 ? null : newValue,
    };
    setInfo(optimisticInfo);

    setLoading(true);
    try {
      const result = await threadsApi.vote(threadId, newValue);
      setInfo(result);
      onVoteChange?.(result);
    } catch {
      // Revert on failure
      setInfo(prevInfo);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-0.5">
      <button
        onClick={() => vote(1)}
        disabled={loading}
        className={`w-7 h-7 flex items-center justify-center rounded text-xs transition-all duration-150
          ${info.user_vote === 1 ? "bg-up/20 text-up" : "text-txt-muted hover:text-up hover:bg-up/10"}`}
      >
        +
      </button>
      <span className={`text-xs font-mono tabular-nums ${
        info.score > 0 ? "text-up" : info.score < 0 ? "text-down" : "text-txt-muted"
      }`}>
        {info.score}
      </span>
      <button
        onClick={() => vote(-1)}
        disabled={loading}
        className={`w-7 h-7 flex items-center justify-center rounded text-xs transition-all duration-150
          ${info.user_vote === -1 ? "bg-down/20 text-down" : "text-txt-muted hover:text-down hover:bg-down/10"}`}
      >
        -
      </button>
    </div>
  );
}
