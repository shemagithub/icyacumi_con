import { PageLoading } from "@/components/page-loading";

export default function Loading() {
  return (
    <PageLoading
      label="Checking the calendar…"
      hint="Ticketed nights and drops loading in."
    />
  );
}
