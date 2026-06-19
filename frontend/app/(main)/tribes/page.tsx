"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Users, ArrowRight, Plus } from "lucide-react";
import { tribesApi } from "@/lib/api";
import { TribeCardSkeleton } from "@/components/ui/Skeleton";
import { FadeUp, StaggerList, StaggerItem } from "@/lib/animation";

export default function TribesPage() {
  const [tribes, setTribes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tribesApi
      .list()
      .then(setTribes)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <FadeUp>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading font-bold text-2xl text-txt">
              Tribes
            </h1>
            <p className="text-sm text-txt-muted mt-1">
              Discover communities that match your interests
            </p>
          </div>
          <button className="btn-primary flex items-center gap-1.5 text-xs">
            <Plus size={14} />
            Create Tribe
          </button>
        </div>
      </FadeUp>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <TribeCardSkeleton key={i} />
          ))}
        </div>
      ) : tribes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card text-center py-16"
        >
          <Users size={40} className="text-txt-faint mx-auto mb-4" />
          <p className="font-heading font-semibold text-lg text-txt mb-2">
            No tribes yet
          </p>
          <p className="text-txt-muted text-sm">
            Create the first community on ThreadIt
          </p>
        </motion.div>
      ) : (
        <StaggerList className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tribes.map((tribe) => (
            <StaggerItem key={tribe.id}>
              <Link href={`/tribe/${tribe.name}`}>
                <div className="card-interactive h-full">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-gold/20 to-gold/5 rounded-xl flex items-center justify-center border border-gold/20 shrink-0">
                      <span className="text-lg font-bold text-gold font-heading">
                        {tribe.name?.[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading font-semibold text-txt">
                        t/{tribe.name}
                      </h3>
                      <p className="text-xs text-txt-faint mt-0.5">
                        {tribe.member_count ?? 0} members
                      </p>
                    </div>
                    <ArrowRight
                      size={16}
                      className="text-txt-faint mt-1 shrink-0"
                    />
                  </div>
                  {tribe.description && (
                    <p className="text-sm text-txt-muted leading-relaxed line-clamp-2">
                      {tribe.description}
                    </p>
                  )}
                </div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerList>
      )}
    </div>
  );
}