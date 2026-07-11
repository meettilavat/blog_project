"use client";

import Link from "next/link";
import PublicStatusNotice, { publicStatusActionClass } from "../components/public-status-notice";

type PublicErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export function retryPublicRoute(reset: () => void) {
  reset();
}

export default function PublicError({ reset }: PublicErrorProps) {
  return (
    <PublicStatusNotice
      label="Temporary interruption"
      title="Something interrupted this page."
      description="The content is still here. Retry the request, or return to the latest writing."
      className="my-auto"
    >
        <button
          type="button"
          onClick={() => retryPublicRoute(reset)}
          className={publicStatusActionClass}
        >
          Try again
        </button>
        <Link
          href="/"
          className={publicStatusActionClass}
        >
          Latest writing
        </Link>
    </PublicStatusNotice>
  );
}
