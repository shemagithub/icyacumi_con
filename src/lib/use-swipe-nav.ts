"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";

const THRESHOLD_PX = 48;
const FAST_PX = 28;
const FAST_MS = 320;

/**
 * Horizontal touch swipe for carousels on phones.
 * Left → next, right → previous. Vertical scroll stays free.
 * After a swipe, `consumeSwipeClick()` blocks the accidental tap.
 */
export function useSwipeNav(options: {
  targetRef: RefObject<HTMLElement | null>;
  enabled?: boolean;
  onNext: () => void;
  onPrev: () => void;
}) {
  const { targetRef, onNext, onPrev } = options;
  const enabled = options.enabled !== false;
  const start = useRef<{ x: number; y: number; t: number } | null>(null);
  const locked = useRef<"h" | "v" | null>(null);
  const swiped = useRef(false);
  const onNextRef = useRef(onNext);
  const onPrevRef = useRef(onPrev);

  useEffect(() => {
    onNextRef.current = onNext;
    onPrevRef.current = onPrev;
  }, [onNext, onPrev]);

  const consumeSwipeClick = useCallback(() => {
    if (!swiped.current) return false;
    swiped.current = false;
    return true;
  }, []);

  useEffect(() => {
    const node = targetRef.current;
    if (!node || !enabled) return;

    const onStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      start.current = { x: touch.clientX, y: touch.clientY, t: Date.now() };
      locked.current = null;
    };

    const onMove = (event: TouchEvent) => {
      if (!start.current) return;
      const touch = event.touches[0];
      if (!touch) return;
      const dx = touch.clientX - start.current.x;
      const dy = touch.clientY - start.current.y;
      if (!locked.current && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
        locked.current = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
      }
      if (locked.current === "h" && event.cancelable) {
        event.preventDefault();
      }
    };

    const onEnd = (event: TouchEvent) => {
      const origin = start.current;
      const axis = locked.current;
      start.current = null;
      locked.current = null;
      if (!origin || axis === "v") return;

      const touch = event.changedTouches[0];
      if (!touch) return;
      const dx = touch.clientX - origin.x;
      const dy = touch.clientY - origin.y;
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 40) return;

      const elapsed = Date.now() - origin.t;
      const fast = elapsed < FAST_MS && Math.abs(dx) > FAST_PX;
      if (dx <= -THRESHOLD_PX || (fast && dx < 0)) {
        swiped.current = true;
        onNextRef.current();
        return;
      }
      if (dx >= THRESHOLD_PX || (fast && dx > 0)) {
        swiped.current = true;
        onPrevRef.current();
      }
    };

    const onCancel = () => {
      start.current = null;
      locked.current = null;
    };

    node.addEventListener("touchstart", onStart, { passive: true });
    node.addEventListener("touchmove", onMove, { passive: false });
    node.addEventListener("touchend", onEnd, { passive: true });
    node.addEventListener("touchcancel", onCancel, { passive: true });

    return () => {
      node.removeEventListener("touchstart", onStart);
      node.removeEventListener("touchmove", onMove);
      node.removeEventListener("touchend", onEnd);
      node.removeEventListener("touchcancel", onCancel);
    };
  }, [enabled, targetRef]);

  return { consumeSwipeClick };
}
