import { compressImageFile } from "@/lib/compress-image";

/** Compress product photos for JSON storage (JPEG). */
export async function fileToProductImageDataUrl(
  file: File,
  maxSize = 720,
): Promise<string> {
  return compressImageFile(file, {
    maxEdge: maxSize,
    quality: 0.68,
    maxBytes: 140_000,
  });
}

export function isDataImageSrc(src: string) {
  return src.startsWith("data:image/");
}
