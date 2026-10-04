import { PageLoading } from "@/components/page-loading";

export default function Loading() {
  return (
    <PageLoading
      label="Opening the floor…"
      hint="Pulling the next drop into place."
    />
  );
}
