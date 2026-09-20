import Link from "next/link";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto mb-4 inline-flex items-center rounded-full bg-purple-50 px-4 py-1.5 text-sm font-semibold text-purple-700">
            We're here to help
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            Contact ProseText
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-gray-600 sm:text-lg">
            Have a question about ProseText, your payment, or an audio
            generation? Get in touch with our support team.
          </p>
        </div>
      </section>

      {/* Contact content */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Support card */}
          <div className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
              <svg
                width="23"
                height="23"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M4 5.5C4 4.672 4.672 4 5.5 4H18.5C19.328 4 20 4.672 20 5.5V15.5C20 16.328 19.328 17 18.5 17H12L7 20V17H5.5C4.672 17 4 16.328 4 15.5V5.5Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 9H16"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <path
                  d="M8 12.5H13"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <h2 className="mt-5 text-xl font-bold text-gray-900">
              Customer Support
            </h2>

            <p className="mt-3 text-sm leading-6 text-gray-600">
              Need help with ProseText? Contact us and provide as much
              information as possible about your issue.
            </p>

            <div className="mt-6 rounded-2xl bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Email
              </p>

              <p className="mt-1 text-sm font-semibold text-gray-900">
                support@prosetext.online
              </p>
            </div>
          </div>

          {/* Payment card */}
          <div className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-green-700">
              <svg
                width="23"
                height="23"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <rect
                  x="3"
                  y="5"
                  width="18"
                  height="14"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path
                  d="M3 10H21"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path
                  d="M7 15H11"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <h2 className="mt-5 text-xl font-bold text-gray-900">
              Payment Help
            </h2>

            <p className="mt-3 text-sm leading-6 text-gray-600">
              If you were charged but your audio was not generated,
              please contact support with your payment details.
            </p>

            <div className="mt-6 rounded-2xl bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Please include
              </p>

              <p className="mt-1 text-sm text-gray-700">
                Payment ID and approximate payment time
              </p>
            </div>
          </div>

          {/* General card */}
          <div className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
              <svg
                width="23"
                height="23"
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
                  strokeWidth="1.8"
                />
                <path
                  d="M12 11V16"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <circle
                  cx="12"
                  cy="7.5"
                  r="1"
                  fill="currentColor"
                />
              </svg>
            </div>

            <h2 className="mt-5 text-xl font-bold text-gray-900">
              General Questions
            </h2>

            <p className="mt-3 text-sm leading-6 text-gray-600">
              Questions about pricing, supported features, or how
              ProseText works? We're happy to help.
            </p>

            <Link
              href="/pricing"
              className="mt-6 inline-flex font-semibold text-purple-600 hover:text-purple-700"
            >
              View pricing →
            </Link>
          </div>
        </div>

        {/* Contact instructions */}
        <div className="mt-10 rounded-3xl border border-purple-100 bg-purple-50 p-7 sm:p-9">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Before contacting support
              </h2>

              <p className="mt-3 text-sm leading-6 text-gray-600">
                To help us resolve your issue faster, please include
                your payment ID if a payment was involved and describe
                what happened.
              </p>
            </div>

            <div className="rounded-2xl border border-purple-100 bg-white p-5">
              <h3 className="font-semibold text-gray-900">
                Useful information
              </h3>

              <ul className="mt-3 space-y-2 text-sm text-gray-600">
                <li>• Payment ID, if applicable</li>
                <li>• Approximate time of the transaction</li>
                <li>• Description of the problem</li>
                <li>• Error message, if you received one</li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 text-center">
          <p className="text-sm text-gray-500">
            Want to create audio instead?
          </p>

          <Link
            href="/#generator"
            className="mt-4 inline-flex items-center rounded-xl bg-purple-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-200 transition hover:bg-purple-700"
          >
            Start Creating Audio
          </Link>
        </div>
      </section>
    </main>
  );
}