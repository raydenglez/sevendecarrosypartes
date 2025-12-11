import { useState, useEffect, useCallback, useRef } from 'react';

interface UseInfiniteScrollOptions {
  threshold?: number;
  initialLimit?: number;
  increment?: number;
}

export function useInfiniteScroll<T>(
  items: T[],
  options: UseInfiniteScrollOptions = {}
) {
  const { threshold = 200, initialLimit = 6, increment = 6 } = options;
  const [displayCount, setDisplayCount] = useState(initialLimit);
  const [isLoading, setIsLoading] = useState(false);
  const loadingRef = useRef(false);

  const displayedItems = items.slice(0, displayCount);
  const hasMore = displayCount < items.length;

  const loadMore = useCallback(() => {
    if (loadingRef.current || !hasMore) return;
    
    loadingRef.current = true;
    setIsLoading(true);
    
    // Simulate loading delay for smooth UX
    setTimeout(() => {
      setDisplayCount(prev => Math.min(prev + increment, items.length));
      setIsLoading(false);
      loadingRef.current = false;
    }, 300);
  }, [hasMore, increment, items.length]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const clientHeight = window.innerHeight;

      if (scrollHeight - scrollTop - clientHeight < threshold) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMore, threshold]);

  const reset = useCallback(() => {
    setDisplayCount(initialLimit);
  }, [initialLimit]);

  return {
    displayedItems,
    hasMore,
    isLoading,
    loadMore,
    reset,
  };
}
