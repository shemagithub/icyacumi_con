/**
 * Client-side image compression for uploads stored as data URLs.
 * Resizes to a max edge, encodes JPEG (or PNG when requested), and
 * steps quality down until under maxBytes when set.
 */

export type CompressImageOptions = {
  /** Longest side in CSS pixels after resize. */
  maxEdge: number;
  /** Starting JPEG quality 0–1. */
  quality?: number;
  /** Soft size cap in bytes for the final data URL payload. */
  maxBytes?: number;
  /** Keep PNG when the source is PNG/WebP/SVG (logos). */
  preferPng?: boolean;
};

function estimateBytes(dataUrl: string) {
  const comma = dataUrl.indexOf(",");
  if (comma < 0) return dataUrl.length;
  const b64 = dataUrl.slice(comma + 1);
  return Math.ceil((b64.length * 3) / 4);
}

function resizedBitmap(file: File, maxEdge: number) {
  return createImageBitmap(file).then((bitmap) => {
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    if (width === bitmap.width && height === bitmap.height) {
      return { bitmap, width, height };
    }
    return createImageBitmap(bitmap, {
      resizeWidth: width,
      resizeHeight: height,
      resizeQuality: "high",
    }).then((resized) => {
      bitmap.close();
      return { bitmap: resized, width, height };
    });
  });
}

function encode(canvas: HTMLCanvasElement, type: string, quality: number) {
  const data = canvas.toDataURL(type, quality);
  if (!data.startsWith(`data:${type}`)) return null;
  return data;
}

export async function compressImageFile(
  file: File,
  opts: CompressImageOptions,
): Promise<string> {
  const { bitmap, width, height } = await resizedBitmap(file, opts.maxEdge);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) {
    bitmap.close();
    throw new Error("Could not process image.");
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const preferPng =
    Boolean(opts.preferPng) &&
    (file.type === "image/png" ||
      file.type === "image/webp" ||
      file.type === "image/svg+xml");

  if (preferPng) {
    const png = canvas.toDataURL("image/png");
    if (!opts.maxBytes || estimateBytes(png) <= opts.maxBytes) return png;
  }

  let quality = Math.min(0.86, Math.max(0.45, opts.quality ?? 0.72));
  let best =
    encode(canvas, "image/webp", quality) ??
    canvas.toDataURL("image/jpeg", quality);
  if (!opts.maxBytes) return best;

  while (estimateBytes(best) > opts.maxBytes && quality > 0.4) {
    quality = Math.round((quality - 0.08) * 100) / 100;
    best =
      encode(canvas, "image/webp", quality) ??
      canvas.toDataURL("image/jpeg", quality);
  }
  return best;
}
