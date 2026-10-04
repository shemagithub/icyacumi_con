"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CultureIcon } from "@/components/culture-icons";
import { MediaImage } from "@/components/media-image";
import { useSwipeNav } from "@/lib/use-swipe-nav";
import type { ProductImage } from "@/lib/types";

const SWIPE_THRESHOLD_PX = 48;

export function ProductGallery({ images }: { images: ProductImage[] }) {
  const [active, setActive] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dialogId = useId();
  const previewRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number; t: number } | null>(null);
  const current = images[active] ?? images[0];
  const hasMany = images.length > 1;

  const goPrev = () =>
    setActive((index) => (index - 1 + images.length) % images.length);
  const goNext = () => setActive((index) => (index + 1) % images.length);

  const { consumeSwipeClick } = useSwipeNav({
    targetRef: previewRef,
    enabled: hasMany && !fullscreen,
    onNext: goNext,
    onPrev: goPrev,
  });

  useEffect(() => {
    const node = previewRef.current;
    if (!node) return;
    const onClickCapture = (event: MouseEvent) => {
      if (!consumeSwipeClick()) return;
      event.preventDefault();
      event.stopPropagation();
    };
    node.addEventListener("click", onClickCapture, true);
    return () => node.removeEventListener("click", onClickCapture, true);
  }, [consumeSwipeClick]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!fullscreen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [fullscreen]);

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFullscreen(false);
        return;
      }
      if (!hasMany) return;
      if (event.key === "ArrowRight") {
        setActive((index) => (index + 1) % images.length);
      }
      if (event.key === "ArrowLeft") {
        setActive((index) => (index - 1 + images.length) % images.length);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen, hasMany, images.length]);

  useEffect(() => {
    if (!fullscreen) {
      setDragOffset(0);
      setDragging(false);
      touchStart.current = null;
    }
  }, [fullscreen]);

  const openFullscreen = (index?: number) => {
    if (typeof index === "number") setActive(index);
    setFullscreen(true);
  };

  const closeFullscreen = () => setFullscreen(false);

  function onTouchStart(event: React.TouchEvent) {
    if (!hasMany || event.touches.length !== 1) return;
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY, t: Date.now() };
    setDragging(true);
    setDragOffset(0);
  }

  function onTouchMove(event: React.TouchEvent) {
    if (!touchStart.current || event.touches.length !== 1) return;
    const touch = event.touches[0];
    const dx = touch.clientX - touchStart.current.x;
    const dy = touch.clientY - touchStart.current.y;
    // Prefer horizontal swipes; ignore mostly-vertical scrolls
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 24) {
      setDragOffset(0);
      return;
    }
    setDragOffset(dx);
  }

  function onTouchEnd(event: React.TouchEvent) {
    if (!touchStart.current) {
      setDragging(false);
      setDragOffset(0);
      return;
    }
    const start = touchStart.current;
    touchStart.current = null;
    setDragging(false);

    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    const elapsed = Date.now() - start.t;
    const fast = elapsed < 320 && Math.abs(dx) > 28;

    setDragOffset(0);

    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 40) return;
    if (!hasMany) return;

    if (dx <= -SWIPE_THRESHOLD_PX || (fast && dx < 0)) {
      goNext();
      return;
    }
    if (dx >= SWIPE_THRESHOLD_PX || (fast && dx > 0)) {
      goPrev();
    }
  }

  function onTouchCancel() {
    touchStart.current = null;
    setDragging(false);
    setDragOffset(0);
  }

  const lightbox =
    fullscreen && mounted
      ? createPortal(
          <div
            className="gallery-lightbox fixed inset-0 z-[200]"
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogId}
          >
            <button
              type="button"
              className="gallery-lightbox__backdrop absolute inset-0 bg-coal/92"
              aria-label="Close full screen image"
              onClick={closeFullscreen}
            />

            <div className="pointer-events-none absolute inset-0 flex flex-col p-3 sm:p-5 lg:p-8">
              <div className="pointer-events-auto flex items-center justify-between gap-3">
                <p
                  id={dialogId}
                  className="font-sans text-[0.65rem] font-bold tracking-[0.2em] text-bone uppercase"
                >
                  Full view
                  {hasMany ? (
                    <span className="ml-2 text-bone/60 tabular-nums">
                      {active + 1} / {images.length}
                    </span>
                  ) : null}
                </p>
                <button
                  type="button"
                  onClick={closeFullscreen}
                  className="craft-btn-ghost inline-flex min-h-11 min-w-11 items-center justify-center gap-2 bg-bone px-3 py-2 text-coal transition-colors hover:text-rust"
                  aria-label="Close full screen"
                >
                  <CultureIcon name="menuClose" className="h-5 w-5 text-rust" />
                  <span className="hidden font-sans text-[0.6rem] font-bold tracking-[0.16em] uppercase sm:inline">
                    Close
                  </span>
                </button>
              </div>

              <div className="relative flex min-h-0 flex-1 items-center justify-center py-4">
                {hasMany && (
                  <button
                    type="button"
                    onClick={goPrev}
                    className="craft-btn-ghost pointer-events-auto absolute top-1/2 left-0 z-10 hidden min-h-11 min-w-11 -translate-y-1/2 items-center justify-center bg-bone/95 text-coal hover:text-rust sm:inline-flex sm:left-2"
                    aria-label="Previous image"
                  >
                    <span aria-hidden className="font-display text-xl leading-none">
                      ‹
                    </span>
                  </button>
                )}

                <div
                  className="gallery-lightbox__stage pointer-events-auto relative mx-auto h-full w-full max-w-5xl touch-pan-y"
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                  onTouchCancel={onTouchCancel}
                >
                  <div
                    className={`craft-frame craft-frame--soft relative h-full min-h-[50vh] w-full overflow-hidden bg-ash ${
                      dragging ? "" : "transition-transform duration-300 ease-out"
                    }`}
                    style={{
                      transform: dragOffset
                        ? `translateX(${dragOffset * 0.35}px)`
                        : undefined,
                    }}
                  >
                    <MediaImage
                      src={current.src}
                      alt={current.alt}
                      fill
                      priority
                      sizes="100vw"
                      className="pointer-events-none select-none object-contain"
                      draggable={false}
                    />
                  </div>
                </div>

                {hasMany && (
                  <button
                    type="button"
                    onClick={goNext}
                    className="craft-btn-ghost pointer-events-auto absolute top-1/2 right-0 z-10 hidden min-h-11 min-w-11 -translate-y-1/2 items-center justify-center bg-bone/95 text-coal hover:text-rust sm:inline-flex sm:right-2"
                    aria-label="Next image"
                  >
                    <span aria-hidden className="font-display text-xl leading-none">
                      ›
                    </span>
                  </button>
                )}
              </div>

              {hasMany && (
                <div className="pointer-events-auto mx-auto flex max-w-full gap-2 overflow-x-auto pb-1">
                  {images.map((image, index) => (
                    <button
                      key={image.src}
                      type="button"
                      onClick={() => setActive(index)}
                      aria-label={`View image ${index + 1}`}
                      aria-current={index === active}
                      className={`relative aspect-[4/5] w-14 shrink-0 overflow-hidden bg-ash transition-opacity sm:w-16 ${
                        index === active
                          ? "opacity-100 ring-2 ring-rust"
                          : "opacity-45 hover:opacity-80"
                      }`}
                    >
                      <MediaImage
                        src={image.src}
                        alt=""
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div>
      <div ref={previewRef} className="touch-pan-y">
        <button
          type="button"
          onClick={() => openFullscreen()}
          className="craft-frame craft-frame--soft group relative aspect-[4/5] w-full cursor-zoom-in overflow-hidden bg-ash text-left"
          aria-label="View image full screen"
        >
          <MediaImage
            src={current.src}
            alt={current.alt}
            fill
            priority
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="pointer-events-none object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            draggable={false}
          />
          <span className="craft-btn pointer-events-none absolute right-3 bottom-3 inline-flex items-center gap-1.5 bg-bone/95 px-3 py-2 text-coal shadow-sm opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
            <CultureIcon name="mask" className="h-4 w-4 text-rust" />
            <span className="font-sans text-[0.6rem] font-bold tracking-[0.16em] uppercase">
              Full view
            </span>
          </span>
        </button>
      </div>

      {hasMany && (
        <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={image.src}
              type="button"
              onClick={() => setActive(index)}
              onDoubleClick={() => openFullscreen(index)}
              aria-label={`View image ${index + 1}`}
              aria-current={index === active}
              className={`relative aspect-[4/5] w-20 overflow-hidden bg-ash transition-opacity ${
                index === active ? "opacity-100" : "opacity-50 hover:opacity-80"
              }`}
            >
              <MediaImage
                src={image.src}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {lightbox}
    </div>
  );
}
