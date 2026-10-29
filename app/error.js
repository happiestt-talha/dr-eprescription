"use client";

import { ErrorState } from "@/components/error-state";

export default function Error({ error, retry, reset }) {
  return <ErrorState variant="page" error={error} onRetry={retry ?? reset} />;
}
