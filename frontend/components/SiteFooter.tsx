"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SiteFooter() {
  const pathname = usePathname();

  /*
   * Admin pages have their own layout.
   * Do not show the public website footer on:
   * /admin
   * /admin/login
   * /admin/*
   */
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-gray-950 text-gray-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">

          {/* Brand */}
          <div className="lg:col-span-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5"
              aria-label="ProseText Home"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-white">
                <svg
                  width="21"
                  height="21"
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

              <span className="text-xl font-bold tracking-tight text-white">
                Prose<span className="text-purple-400">Text</span>
              </span>
            </Link>

            <p className="mt-4 max-w-md text-sm leading-6 text-gray-400">
              Turn your written text into natural-sounding speech.
              Create high-quality MP3 audio quickly and easily
              without creating an account.
            </p>

            <Link
              href="/#generator"
              className="mt-6 inline-flex items-center rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700"
            >
              Start Creating
            </Link>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Product
            </h3>

            <ul className="mt-4 space-y-3">
              <li>
                <Link
                  href="/"
                  className="text-sm text-gray-400 transition hover:text-white"
                >
                  Home
                </Link>
              </li>

              <li>
                <Link
                  href="/#generator"
                  className="text-sm text-gray-400 transition hover:text-white"
                >
                  Text to Speech
                </Link>
              </li>

              <li>
                <Link
                  href="/pricing"
                  className="text-sm text-gray-400 transition hover:text-white"
                >
                  Pricing
                </Link>
              </li>

              <li>
                <Link
                  href="/contact"
                  className="text-sm text-gray-400 transition hover:text-white"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Information */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Information
            </h3>

            <ul className="mt-4 space-y-3">
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-gray-400 transition hover:text-white"
                >
                  Privacy Policy
                </Link>
              </li>

              <li>
                <Link
                  href="/terms"
                  className="text-sm text-gray-400 transition hover:text-white"
                >
                  Terms of Service
                </Link>
              </li>

              <li>
                <Link
                  href="/refund"
                  className="text-sm text-gray-400 transition hover:text-white"
                >
                  Refund Policy
                </Link>
              </li>

              <li>
                <Link
                  href="/contact"
                  className="text-sm text-gray-400 transition hover:text-white"
                >
                  Support
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 border-t border-gray-800 pt-6">
          <div className="flex flex-col gap-3 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {currentYear} ProseText. All rights reserved.
            </p>

            <p>
              AI-powered text to speech
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}