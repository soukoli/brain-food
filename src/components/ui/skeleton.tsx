import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("animate-pulse rounded-md bg-border", className)} />;
}

export function CardSkeleton() {
  return (
    <div className="p-4 bg-surface rounded-lg border border-border shadow-card">
      <div className="flex items-center gap-4">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="w-5 h-5 rounded" />
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="p-4 bg-surface rounded-lg border border-border shadow-card text-center">
      <Skeleton className="w-10 h-10 mx-auto mb-2 rounded-full" />
      <Skeleton className="h-6 w-8 mx-auto mb-1" />
      <Skeleton className="h-3 w-12 mx-auto" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="px-4 pb-4 space-y-4 animate-in fade-in duration-200">
      {/* Quote skeleton */}
      <div className="p-4 bg-primary-light rounded-lg">
        <div className="flex items-start gap-3">
          <Skeleton className="w-8 h-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-24 mt-2" />
          </div>
        </div>
      </div>

      {/* Quick actions skeleton */}
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-14 rounded-lg" />
        <Skeleton className="h-14 rounded-lg" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-3 gap-3">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Recent ideas skeleton */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="space-y-2">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    </div>
  );
}

export function ProjectsSkeleton() {
  return (
    <div className="px-4 space-y-3 animate-in fade-in duration-200">
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  );
}

export function FocusSkeleton() {
  return (
    <div className="px-4 space-y-4 animate-in fade-in duration-200">
      {/* Stats card skeleton */}
      <div className="p-5 bg-primary-light rounded-lg">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-16" />
          </div>
          <div className="space-y-2 text-right">
            <Skeleton className="h-3 w-20 ml-auto" />
            <Skeleton className="h-7 w-16 ml-auto" />
          </div>
        </div>
      </div>

      {/* Tasks skeleton */}
      <div className="space-y-3">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}
