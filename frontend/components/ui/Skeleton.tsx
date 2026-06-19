export function SkeletonLine({
  width = "100%",
  height = "1rem",
  className = "",
}: {
  width?: string;
  height?: string;
  className?: string;
}) {
  return (
    <div
      className={`shimmer-bg rounded-lg ${className}`}
      style={{ width, height }}
    />
  );
}

export function SkeletonCircle({
  size = "2.5rem",
  className = "",
}: {
  size?: string;
  className?: string;
}) {
  return (
    <div
      className={`shimmer-bg rounded-full shrink-0 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

export function ThreadCardSkeleton() {
  return (
    <div className="card space-y-3 animate-pulse">
      <div className="flex items-center gap-3">
        <SkeletonCircle size="2rem" />
        <SkeletonLine width="120px" height="0.75rem" />
        <SkeletonLine width="60px" height="0.75rem" className="ml-auto" />
      </div>
      <SkeletonLine width="75%" height="1rem" />
      <SkeletonLine width="100%" height="0.75rem" />
      <SkeletonLine width="90%" height="0.75rem" />
      <div className="flex gap-3 pt-2">
        <SkeletonLine width="60px" height="1.5rem" />
        <SkeletonLine width="60px" height="1.5rem" />
      </div>
    </div>
  );
}

export function TribeCardSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <SkeletonCircle size="2.5rem" />
        <div className="space-y-1.5 flex-1">
          <SkeletonLine width="100px" height="0.875rem" />
          <SkeletonLine width="60px" height="0.625rem" />
        </div>
      </div>
      <SkeletonLine width="100%" height="0.75rem" />
      <SkeletonLine width="80%" height="0.75rem" className="mt-1.5" />
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="card animate-pulse space-y-4">
      <div className="flex items-center gap-4">
        <SkeletonCircle size="4rem" />
        <div className="space-y-2 flex-1">
          <SkeletonLine width="150px" height="1rem" />
          <SkeletonLine width="100px" height="0.75rem" />
        </div>
      </div>
      <SkeletonLine width="100%" height="0.75rem" />
      <SkeletonLine width="60%" height="0.75rem" />
    </div>
  );
}

export function CommentSkeleton() {
  return (
    <div className="animate-pulse space-y-2 py-3">
      <div className="flex items-center gap-2">
        <SkeletonCircle size="1.5rem" />
        <SkeletonLine width="80px" height="0.625rem" />
        <SkeletonLine width="40px" height="0.625rem" />
      </div>
      <SkeletonLine width="100%" height="0.75rem" />
      <SkeletonLine width="70%" height="0.75rem" />
    </div>
  );
}