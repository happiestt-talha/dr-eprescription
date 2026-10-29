"use client";

import { ErrorState } from "@/components/error-state";

// Inside the portal layout, so the sidebar and top bar stay usable.
export default function Error({ error, retry, reset }) {
  return <ErrorState variant="inline" error={error} onRetry={retry ?? reset} />;
}
