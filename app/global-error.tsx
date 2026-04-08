"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="text-zinc-600 max-w-md text-sm">
            A critical error occurred. Please try again or return to the home page.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
            >
              Try again
            </button>
            <a href="/" className="text-sm text-zinc-600 underline underline-offset-4">
              Go home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
