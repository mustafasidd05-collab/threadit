"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronUp, ChevronDown } from "lucide-react";
import { threadsApi } from "@/lib/api";

interface VoteButtonsProps {
  threadId: string;
  initialScore: number;
  initialVote: number;
  compact?: boolean;
}

export default function VoteButtons({
  threadId,
  initialScore,
  initialVote,
  compact = false,
}: VoteButtonsProps) {
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState(initialVote);
  const [voting, setVoting] = useState(false);

  const handleVote = async (value: number) => {
    if (voting) return;
    setVoting(true);

    const newValue = userVote === value ? 0 : value;
    const diff = newValue - userVote;

    setScore(score + diff);
    setUserVote(newValue);

    try {
      await threadsApi.vote(threadId, newValue);
    } catch {
      setScore(score);
      setUserVote(userVote);
    } finally {
      setVoting(false);
    }
  };

  const iconSize = compact ? 18 : 22;

  return (
    <div
      className={`flex flex-col items-center gap-0.5 ${
        compact ? "" : "gap-1"
      }`}
    >
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={() => handleVote(1)}
        className={`rounded-lg transition-all duration-200 ${
          compact ? "p-0.5" : "p-1"
        } ${
          userVote === 1
            ? "text-up bg-up/10"
            : "text-txt-faint hover:text-up hover:bg-up/10"
        }`}
      >
        <ChevronUp size={iconSize} strokeWidth={2.5} />
      </motion.button>

      <span
        className={`font-mono font-bold leading-none ${
          compact ? "text-xs" : "text-sm"
        } ${
          userVote === 1
            ? "text-up"
            : userVote === -1
            ? "text-down"
            : "text-txt-muted"
        }`}
      >
        {score}
      </span>

      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={() => handleVote(-1)}
        className={`rounded-lg transition-all duration-200 ${
          compact ? "p-0.5" : "p-1"
        } ${
          userVote === -1
            ? "text-down bg-down/10"
            : "text-txt-faint hover:text-down hover:bg-down/10"
        }`}
      >
        <ChevronDown size={iconSize} strokeWidth={2.5} />
      </motion.button>
    </div>
  );
}