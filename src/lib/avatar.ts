import { compressImageFile } from "@/lib/compress-image";

/** Compress an image file to a small JPEG data URL for avatar storage. */
export async function fileToAvatarDataUrl(
  file: File,
  maxSize = 128,
): Promise<string> {
  return compressImageFile(file, {
    maxEdge: maxSize,
    quality: 0.74,
    maxBytes: 28_000,
  });
}

export function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}
