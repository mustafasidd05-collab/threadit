"use client";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-surface-3 rounded-lg ${className}`} />
  );
}

export function ThreadCardSkeleton() {
  return (
    <div className="card flex gap-4">
      <div className="flex flex-col items-center gap-1">
        <Skeleton className="w-7 h-7 rounded" />
        <Skeleton className="w-5 h-4 rounded" />
        <Skeleton className="w-7 h-7 rounded" />
      </div>
      <div className="flex-1 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex gap-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-14" />
        </div>
      </div>
    </div>
  );
}

export function TribeCardSkeleton() {
  return (
    <div className="card flex items-center justify-between gap-4">
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-40" />
      </div>
      <Skeleton className="h-9 w-16 rounded-lg" />
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="card flex items-center gap-5">
      <Skeleton className="w-16 h-16 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
          <Skeleton className={`h-10 ${i % 2 === 0 ? "w-48" : "w-36"} rounded-2xl`} />
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ count = 5, variant = "thread" }: { count?: number; variant?: "thread" | "tribe" | "profile" }) {
  const Component = variant === "tribe" ? TribeCardSkeleton : variant === "profile" ? ProfileSkeleton : ThreadCardSkeleton;
  return (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <Component key={i} />
      ))}
    </div>
  );
}
