import { useState, useEffect, useRef, useCallback } from "react";

interface UseInfiniteScrollOptions {
  totalCount: number;
  pageSize: number;
  resetDeps: any[];
}

export function useInfiniteScroll({ totalCount, pageSize, resetDeps }: UseInfiniteScrollOptions) {
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Reset pagination when dependencies change
  useEffect(() => {
    setVisibleCount(pageSize);
  }, resetDeps);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && visibleCount < totalCount) {
        setVisibleCount((prev) => Math.min(prev + pageSize, totalCount));
      }
    },
    [totalCount, visibleCount, pageSize],
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: "20px",
      threshold: 0.1,
    });

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [handleObserver]);

  return { visibleCount, observerTarget };
}
