"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  getSession,
  signOut,
} from "@/lib/supabase-auth";

export default function SiteHeader() {
  const pathname = usePathname();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    function checkAuth() {
      setLoggedIn(!!getSession());
    }

    checkAuth();

    window.addEventListener(
      "ProseText-auth-change",
      checkAuth
    );

    window.addEventListener(
      "storage",
      checkAuth
    );

    return () => {
      window.removeEventListener(
        "ProseText-auth-change",
        checkAuth
      );

      window.removeEventListener(
        "storage",
        checkAuth
      );
    };
  }, []);

  /*
   * Admin pages have their own layout.
   * Do not show the public website header there.
   */
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  function handleSignOut() {
    signOut();

    window.location.href = "/";
  }

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-gray-200/80 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5"
          aria-label="ProseText Home"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md shadow-purple-200">
            <svg
              width="20"
              height="20"
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

          <span className="text-xl font-bold tracking-tight text-gray-900">
            Prose<span className="text-purple-600">Text</span>
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav
          className="hidden items-center gap-8 md:flex"
          aria-label="Main navigation"
        >
          <Link
            href="/"
            className="text-sm font-medium text-gray-700 transition hover:text-purple-600"
          >
            Home
          </Link>

          <Link
            href="/voices"
            className="text-sm font-medium text-gray-700 transition hover:text-purple-600"
          >
            Voices
          </Link>

          <Link
            href="/#generator"
            className="text-sm font-medium text-gray-700 transition hover:text-purple-600"
          >
            Text to Speech
          </Link>

          <Link
            href="/pricing"
            className="text-sm font-medium text-gray-700 transition hover:text-purple-600"
          >
            Pricing
          </Link>

          <Link
            href="/contact"
            className="text-sm font-medium text-gray-700 transition hover:text-purple-600"
          >
            Contact
          </Link>
        </nav>

        {/* Desktop account area */}
        <div className="hidden items-center gap-3 md:flex">

          {!loggedIn ? (
            <>
              {/* Sign in */}
              <Link
                href="/login"
                className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 hover:text-purple-600"
              >
                Sign in
              </Link>

              {/* Create account */}
              <Link
                href="/signup"
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-purple-300 hover:text-purple-600"
              >
                Create account
              </Link>
            </>
          ) : (
            /* Sign out */
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
            >
              Sign out
            </button>
          )}

          {/* Start Creating */}
          {/* <Link
            href="/#generator"
            className="inline-flex items-center justify-center rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-purple-200 transition hover:bg-purple-700 hover:shadow-lg"
          >
            Start Creating
          </Link> */}
        </div>

        {/* Mobile menu */}
        <details className="relative md:hidden">
          <summary
            className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 transition hover:border-purple-300 hover:text-purple-600 [&::-webkit-details-marker]:hidden"
            aria-label="Open navigation menu"
          >
            <svg
              width="21"
              height="21"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M4 6H20"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M4 12H20"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M4 18H20"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </summary>

          <div className="absolute right-0 top-12 w-64 overflow-hidden rounded-2xl border border-gray-200 bg-white p-2 shadow-xl">
            <nav
              className="flex flex-col"
              aria-label="Mobile navigation"
            >
              {/* Home */}
              <Link
                href="/"
                className="rounded-xl px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-purple-50 hover:text-purple-600"
              >
                Home
              </Link>

              {/* Voices */}
              <Link
                href="/voices"
                className="rounded-xl px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-purple-50 hover:text-purple-600"
              >
                Voices
              </Link>

              {/* Text to Speech */}
              <Link
                href="/#generator"
                className="rounded-xl px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-purple-50 hover:text-purple-600"
              >
                Text to Speech
              </Link>

              {/* Pricing */}
              <Link
                href="/pricing"
                className="rounded-xl px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-purple-50 hover:text-purple-600"
              >
                Pricing
              </Link>

              {/* Contact */}
              <Link
                href="/contact"
                className="rounded-xl px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-purple-50 hover:text-purple-600"
              >
                Contact
              </Link>

              {!loggedIn ? (
                <>
                  <div className="my-2 border-t border-gray-100" />

                  {/* Sign in */}
                  <Link
                    href="/login"
                    className="rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-purple-50 hover:text-purple-600"
                  >
                    Sign in
                  </Link>

                  {/* Create account */}
                  <Link
                    href="/signup"
                    className="rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-purple-50 hover:text-purple-600"
                  >
                    Create account
                  </Link>
                </>
              ) : (
                <>
                  <div className="my-2 border-t border-gray-100" />

                  {/* Sign out */}
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="rounded-xl px-4 py-3 text-left text-sm font-semibold text-gray-700 transition hover:bg-red-50 hover:text-red-600"
                  >
                    Sign out
                  </button>
                </>
              )}

              <div className="my-2 border-t border-gray-100" />

              {/* Start Creating */}
              {/* <Link
                href="/#generator"
                className="rounded-xl bg-purple-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-purple-700"
              >
                Start Creating
              </Link> */}
            </nav>
          </div>
        </details>
      </div>
    </header>
  );
}