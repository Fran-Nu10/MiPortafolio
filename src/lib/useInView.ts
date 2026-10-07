"use client";

import { useEffect, useState, useSyncExternalStore, type RefObject } from "react";

/**
 * IntersectionObserver hook shared by the media components. Reports whether at least
 * `threshold` of the element is visible. Visibility is structure (it decides whether a
 * video plays), not animation progress, so it may be React state.
 */
export function useInView(
  ref: RefObject<Element | null>,
  { threshold = 0.5, rootMargin = "0px" }: { threshold?: number; rootMargin?: string } = {},
): boolean {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting && entry.intersectionRatio >= threshold - 1e-3),
      { threshold: [0, threshold], rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, threshold, rootMargin]);
  return inView;
}

function subscribeVisibility(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

/** document visibility: videos pause while the tab is hidden */
export function usePageVisible(): boolean {
  return useSyncExternalStore(
    subscribeVisibility,
    () => document.visibilityState !== "hidden",
    () => true,
  );
}
