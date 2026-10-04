"use client";

import { useEffect } from "react";

/**
 * iOS Safari zooms into inputs under 16px, then sometimes stays zoomed after
 * the keyboard closes. We prevent the zoom via CSS (16px inputs) and reset
 * any leftover scale when the keyboard dismisses.
 */
export function MobileKeyboardViewport() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const coarse = window.matchMedia("(hover: none), (pointer: coarse)");
    if (!coarse.matches) return;

    const viewport = window.visualViewport;
    let keyboardLikelyOpen = false;

    function resetStuckZoom() {
      if (document.activeElement instanceof HTMLElement) {
        const tag = document.activeElement.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      }

      const scale = viewport?.scale ?? 1;
      if (scale > 1.01) {
        const meta = document.querySelector('meta[name="viewport"]');
        if (meta) {
          const prev = meta.getAttribute("content") ?? "width=device-width, initial-scale=1";
          meta.setAttribute(
            "content",
            "width=device-width, initial-scale=1, maximum-scale=1",
          );
          window.setTimeout(() => {
            meta.setAttribute("content", prev.replace(/,?\s*maximum-scale\s*=\s*[\d.]+/gi, ""));
          }, 50);
        }
      }

      // Nudge layout so the page settles back after the keyboard.
      const y = window.scrollY;
      window.scrollTo(0, y + 1);
      window.scrollTo(0, y);
    }

    function onViewportResize() {
      if (!viewport) return;
      const open = viewport.height < window.innerHeight * 0.8;
      if (keyboardLikelyOpen && !open) {
        window.setTimeout(resetStuckZoom, 80);
      }
      keyboardLikelyOpen = open;
    }

    function onFocusOut(event: FocusEvent) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (!target.matches("input, textarea, select, [contenteditable='true']")) return;
      window.setTimeout(resetStuckZoom, 120);
    }

    viewport?.addEventListener("resize", onViewportResize);
    document.addEventListener("focusout", onFocusOut, true);
    return () => {
      viewport?.removeEventListener("resize", onViewportResize);
      document.removeEventListener("focusout", onFocusOut, true);
    };
  }, []);

  return null;
}
