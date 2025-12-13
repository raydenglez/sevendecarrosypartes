import { useState, useRef, useCallback, ReactNode } from 'react';
import { Loader2, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  className?: string;
}

export function PullToRefresh({ onRefresh, children, className }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  const threshold = 80;
  const maxPull = 120;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0 && !isRefreshing) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;

    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;

    if (diff > 0 && containerRef.current?.scrollTop === 0) {
      // Apply resistance to make it feel natural
      const resistance = 0.5;
      const distance = Math.min(diff * resistance, maxPull);
      setPullDistance(distance);
    }
  }, [isPulling, isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;

    setIsPulling(false);

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(60); // Keep indicator visible during refresh
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, isRefreshing, onRefresh, isPulling]);

  const progress = Math.min(pullDistance / threshold, 1);
  const rotation = progress * 180;

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-auto", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className={cn(
          "absolute left-0 right-0 flex justify-center z-50 transition-opacity duration-200",
          pullDistance > 0 || isRefreshing ? "opacity-100" : "opacity-0"
        )}
        style={{
          top: Math.max(pullDistance - 50, -50),
          transform: `translateY(${pullDistance > 0 ? 0 : -20}px)`,
        }}
      >
        <div
          className={cn(
            "w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center backdrop-blur-sm",
            "transition-all duration-300 ease-out",
            pullDistance >= threshold && !isRefreshing && "bg-primary/20 scale-110"
          )}
        >
          {isRefreshing ? (
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          ) : (
            <ArrowDown
              className={cn(
                "w-5 h-5 text-primary transition-transform duration-200",
                pullDistance >= threshold && "text-primary"
              )}
              style={{ transform: `rotate(${rotation}deg)` }}
            />
          )}
        </div>
      </div>

      {/* Content with pull offset */}
      <div
        className="transition-transform duration-200 ease-out"
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}
