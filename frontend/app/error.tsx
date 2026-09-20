"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-gray-50 px-4">
      <section className="w-full max-w-xl text-center">
        {/* Icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-red-100 text-red-600">
          <svg
            width="38"
            height="38"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              strokeWidth="2"
            />

            <path
              d="M12 7V13"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />

            <circle
              cx="12"
              cy="16.5"
              r="1"
              fill="currentColor"
            />
          </svg>
        </div>

        <p className="mt-8 text-sm font-bold uppercase tracking-widest text-red-600">
          Something went wrong
        </p>

        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          We couldn't load this page
        </h1>

        <p className="mx-auto mt-5 max-w-md text-base leading-7 text-gray-600">
          An unexpected error occurred. You can try again or return to
          ProseText and continue creating your audio.
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center rounded-xl bg-purple-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-200 transition hover:bg-purple-700"
          >
            Try Again
          </button>

          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3.5 text-sm font-bold text-gray-900 transition hover:border-purple-400 hover:bg-purple-50 hover:text-purple-700"
          >
            Go to Homepage
          </Link>
        </div>

        <p className="mt-8 text-sm text-gray-500">
          If the problem continues, please contact ProseText support.
        </p>

        <Link
          href="/contact"
          className="mt-2 inline-block text-sm font-semibold text-purple-600 hover:text-purple-700"
        >
          Contact Support →
        </Link>
      </section>
    </main>
  );
}