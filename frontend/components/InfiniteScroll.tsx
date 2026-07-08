'use client';

import { useEffect, useRef, useCallback } from 'react';

interface InfiniteScrollProps {
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  children: React.ReactNode;
}

export default function InfiniteScroll({ onLoadMore, hasMore, isLoading, children }: InfiniteScrollProps) {
  const observerRef = useRef<HTMLDivElement>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && hasMore && !isLoading) {
        onLoadMore();
      }
    },
    [onLoadMore, hasMore, isLoading]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '200px',
      threshold: 0,
    });

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [handleObserver]);

  return (
    <div>
      {children}

      {/* Sentinel element */}
      <div ref={observerRef} className="h-4" />

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="flex items-center gap-2 text-text-muted">
            <div className="w-5 h-5 border-2 border-border border-t-text-primary rounded-full animate-spin" />
            <span className="font-body text-sm">Loading more photos...</span>
          </div>
        </div>
      )}

      {/* End message */}
      {!hasMore && !isLoading && (
        <div className="text-center py-8">
          <p className="font-body text-xs tracking-[0.2em] uppercase text-text-muted">
            — End of gallery —
          </p>
        </div>
      )}
    </div>
  );
}
