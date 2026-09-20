"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("ProseText global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <main className="flex min-h-screen items-center justify-center px-4">
          <section className="w-full max-w-xl text-center">
            {/* Logo */}
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-purple-100 text-purple-600">
              <svg
                width="38"
                height="38"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M12 3V21"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M7 7V17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M17 7V17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M3 10V14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M21 10V14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <h1 className="mt-7 text-2xl font-extrabold text-gray-900">
              Prose<span className="text-purple-600">Text</span>
            </h1>

            <p className="mt-5 text-sm font-bold uppercase tracking-widest text-purple-600">
              Application error
            </p>

            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Something went wrong
            </h2>

            <p className="mx-auto mt-5 max-w-md text-base leading-7 text-gray-600">
              ProseText encountered an unexpected problem. Please try
              loading the application again.
            </p>

            <button
              type="button"
              onClick={() => reset()}
              className="mt-8 inline-flex items-center justify-center rounded-xl bg-purple-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-200 transition hover:bg-purple-700"
            >
              Try Again
            </button>

            <p className="mt-8 text-sm text-gray-500">
              If the problem continues, please try again later or contact
              ProseText support.
            </p>
          </section>
        </main>
      </body>
    </html>
  );
}