import { cn } from '../lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("animate-pulse bg-[#2A2A2A] rounded-md", className)} />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="w-32 h-4" />
          <Skeleton className="w-24 h-3" />
        </div>
      </div>
      <Skeleton className="w-full h-24" />
    </div>
  );
}
