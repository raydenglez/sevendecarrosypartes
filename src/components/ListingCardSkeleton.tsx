import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ListingCardSkeletonProps {
  variant?: 'featured' | 'grid' | 'list';
  className?: string;
}

export function ListingCardSkeleton({ variant = 'featured', className }: ListingCardSkeletonProps) {
  if (variant === 'grid') {
    return (
      <div className={cn("bg-card rounded-xl overflow-hidden", className)}>
        <Skeleton className="aspect-square w-full" />
        <div className="p-2.5 space-y-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={cn("flex gap-4 p-3 bg-card rounded-xl", className)}>
        <Skeleton className="w-28 h-24 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-[280px] shrink-0 bg-card rounded-2xl overflow-hidden", className)}>
      <Skeleton className="aspect-[4/3] w-full" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-6 w-24" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}
