"use client";

import Image from "next/image";
import { isDataImageSrc } from "@/lib/product-images";

/** Next/Image-safe media: falls back to <img> for data URLs. */
export function MediaImage({
  src,
  alt,
  fill,
  width,
  height,
  className = "",
  sizes,
  priority = false,
  quality = 75,
  draggable,
}: {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
  /** Must match next.config images.qualities (60 | 75). */
  quality?: 60 | 75;
  draggable?: boolean;
}) {
  if (isDataImageSrc(src)) {
    if (fill) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          draggable={draggable}
          decoding="async"
          loading={priority ? "eager" : "lazy"}
          className={`absolute inset-0 h-full w-full ${className}`}
        />
      );
    }
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        draggable={draggable}
        decoding="async"
        loading={priority ? "eager" : "lazy"}
        className={className}
      />
    );
  }

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        quality={quality}
        draggable={draggable}
        className={className}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width ?? 100}
      height={height ?? 100}
      sizes={sizes}
      priority={priority}
      quality={quality}
      draggable={draggable}
      className={className}
    />
  );
}
