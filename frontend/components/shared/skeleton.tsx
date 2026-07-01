import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-[#151921]",
        className
      )}
    />
  );
}

export function KPICardSkeleton() {
  return (
    <div className="rounded-xl border border-[#1E2737] bg-[#0F1217] p-5">
      <Skeleton className="h-3 w-20 mb-4" />
      <Skeleton className="h-7 w-28 mb-3" />
      <Skeleton className="h-4 w-24" />
    </div>
  );
}
