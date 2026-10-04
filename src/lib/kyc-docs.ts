/** Compress KYC images; pass through PDFs as data URLs (max ~3.5MB). */

import { compressImageFile } from "@/lib/compress-image";

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") resolve(result);
      else reject(new Error("Could not read file."));
    };
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}

export async function fileToKycDataUrl(file: File): Promise<string> {
  const type = file.type || "";
  if (type.startsWith("image/")) {
    return compressImageFile(file, {
      maxEdge: 1200,
      quality: 0.74,
      maxBytes: 350_000,
    });
  }
  if (type === "application/pdf") {
    if (file.size > 3_500_000) {
      throw new Error("PDF must be under 3.5MB.");
    }
    return readFileAsDataUrl(file);
  }
  throw new Error("Upload a JPG, PNG, WEBP, or PDF.");
}

export function kycDocKind(
  dataUrl: string | null | undefined,
): "image" | "pdf" | null {
  if (!dataUrl) return null;
  if (dataUrl.startsWith("data:application/pdf")) return "pdf";
  if (dataUrl.startsWith("data:image/")) return "image";
  return null;
}
