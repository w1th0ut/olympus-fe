"use client";

import { useEffect, useRef, useState } from "react";

type UseInitialSkeletonOptions = {
  minimumDurationMs?: number;
  resetKey?: string | number | null;
};

/**
 * Shows a full skeleton only for the initial load of a section or detail view.
 * After the first successful load, background refetches should keep content visible.
 */
export function useInitialSkeleton(
  isLoading: boolean,
  options: UseInitialSkeletonOptions = {},
) {
  const { minimumDurationMs = 650, resetKey = null } = options;
  const [isInitialSkeletonVisible, setIsInitialSkeletonVisible] = useState(true);
  const revealAfterRef = useRef(Date.now() + minimumDurationMs);
  const lastResetKeyRef = useRef(resetKey);

  useEffect(() => {
    if (lastResetKeyRef.current === resetKey) {
      return;
    }

    lastResetKeyRef.current = resetKey;
    revealAfterRef.current = Date.now() + minimumDurationMs;
    setIsInitialSkeletonVisible(true);
  }, [minimumDurationMs, resetKey]);

  useEffect(() => {
    if (!isInitialSkeletonVisible || isLoading) {
      return;
    }

    const remainingMs = revealAfterRef.current - Date.now();
    if (remainingMs <= 0) {
      setIsInitialSkeletonVisible(false);
      return;
    }

    const timeout = window.setTimeout(() => {
      setIsInitialSkeletonVisible(false);
    }, remainingMs);

    return () => window.clearTimeout(timeout);
  }, [isInitialSkeletonVisible, isLoading]);

  return isInitialSkeletonVisible;
}
