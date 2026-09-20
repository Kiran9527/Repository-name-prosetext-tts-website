"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type Plan = {
  id: string;
  name: string;
  price: number;
  characters: number;
  included_characters?: number;
  offer_price: number | null;
};

const descriptions: Record<string, string> = {
  Starter: "Perfect for short voiceovers and quick projects.",
  Creator: "Great for videos, social media, and regular content.",
  Pro: "Ideal for longer videos, narration, and projects.",
  Long: "For large scripts, detailed narration, and long-form content.",
};

const features = [
  "Natural-sounding AI speech",
  "MP3 audio output",
  "One payment = one generation",
  "Download your generated audio",
];

/*
 * Admin Pricing is the single source of truth.
 *
 * Rules:
 * - If Admin has a valid offer_price lower than price,
 *   show offer_price.
 * - Otherwise show the regular price.
 * - Offer dates are intentionally not used here so the
 *   customer-facing price always matches Admin pricing.
 */
function getDisplayPrice(plan: Plan): {
  price: number;
  hasOffer: boolean;
} {
  const regularPrice = Number(plan.price);
  const offerPrice =
    plan.offer_price !== null
      ? Number(plan.offer_price)
      : null;

  if (
    Number.isFinite(offerPrice) &&
    offerPrice !== null &&
    offerPrice >= 0 &&
    offerPrice < regularPrice
  ) {
    return {
      price: offerPrice,
      hasOffer: true,
    };
  }

  return {
    price: regularPrice,
    hasOffer: false,
  };
}

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPricing() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/pricing?t=${Date.now()}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.detail || "Unable to load pricing."
          );
        }

        if (!data?.plans || !Array.isArray(data.plans)) {
          throw new Error("Invalid pricing data received.");
        }

        setPlans(data.plans);
      } catch (err) {
        console.error("Pricing load error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load pricing."
        );
      } finally {
        setLoading(false);
      }
    }

    loadPricing();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-gray-200 bg-white">
        <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-purple-200/40 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto mb-4 inline-flex items-center rounded-full bg-purple-50 px-4 py-1.5 text-sm font-semibold text-purple-700">
            Simple, transparent pricing
          </div>

          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            Pay only for the audio you need
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-gray-600 sm:text-lg">
            Choose a character limit, pay securely, and turn your text
            into a downloadable MP3. No subscription and no account required.
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        {/* Loading */}
        {loading && (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600" />

              <p className="mt-4 text-sm font-medium text-gray-600">
                Loading pricing...
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <h2 className="font-bold text-red-800">
              Unable to load pricing
            </h2>

            <p className="mt-2 text-sm text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Plans */}
        {!loading && !error && plans.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => {
              const popular =
                plan.name.toLowerCase() === "creator";

              const {
                price: displayPrice,
                hasOffer,
              } = getDisplayPrice(plan);

              const description =
                descriptions[plan.name] ||
                "Choose this plan for your AI voice generation needs.";

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-3xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${
                    popular
                      ? "border-purple-500 ring-2 ring-purple-100"
                      : "border-gray-200"
                  }`}
                >
                  {/* Popular badge */}
                  {popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-purple-600 px-4 py-1 text-xs font-bold text-white shadow-md">
                      MOST POPULAR
                    </div>
                  )}

                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {plan.name}
                    </h2>

                    <p className="mt-2 min-h-[48px] text-sm leading-6 text-gray-500">
                      {description}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mt-6">
                    <div className="flex items-end gap-2">
                      <span className="text-4xl font-extrabold tracking-tight text-gray-900">
                        ₹{displayPrice}
                      </span>

                      {hasOffer && (
                        <span className="mb-1 text-lg font-medium text-gray-400 line-through">
                          ₹{Number(plan.price)}
                        </span>
                      )}
                    </div>

                    {hasOffer && (
                      <p className="mt-1 text-xs font-semibold text-green-600">
                        Special offer
                      </p>
                    )}

                    <p className="mt-2 text-sm font-medium text-purple-600">
                      Up to{" "}
                      {Number(
                        plan.included_characters ??
                          plan.characters ??
                          0
                      ).toLocaleString()}{" "}
                      characters
                    </p>
                  </div>

                  <div className="my-6 border-t border-gray-100" />

                  {/* Features */}
                  <ul className="space-y-3">
                    {features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2.5 text-sm text-gray-600"
                      >
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-hidden="true"
                          >
                            <path
                              d="M5 12L10 17L19 7"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>

                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Choose button */}
                  <Link
                    href={`/?plan=${encodeURIComponent(plan.id)}#generator`}
                    className={`mt-8 flex w-full items-center justify-center rounded-xl px-5 py-3.5 text-sm font-bold transition ${
                      popular
                        ? "bg-purple-600 text-white shadow-lg shadow-purple-200 hover:bg-purple-700"
                        : "border border-gray-300 bg-white text-gray-900 hover:border-purple-400 hover:bg-purple-50 hover:text-purple-700"
                    }`}
                  >
                    Choose {plan.name}
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        {/* No plans */}
        {!loading && !error && plans.length === 0 && (
          <div className="mx-auto max-w-xl rounded-2xl border border-gray-200 bg-white p-8 text-center">
            <h2 className="font-bold text-gray-900">
              No pricing plans available
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              Please check the pricing configuration in the admin panel.
            </p>
          </div>
        )}
      </section>

      {/* How pricing works */}
      <section className="border-y border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              How ProseText pricing works
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-gray-600">
              No complicated subscriptions. Pick a plan based on the length
              of your script.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {/* Step 1 */}
            <div className="rounded-2xl bg-gray-50 p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-lg font-bold text-purple-700">
                1
              </div>

              <h3 className="mt-4 font-bold text-gray-900">
                Enter your text
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                Paste or write the script you want to convert into speech.
              </p>
            </div>

            {/* Step 2 */}
            <div className="rounded-2xl bg-gray-50 p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-lg font-bold text-purple-700">
                2
              </div>

              <h3 className="mt-4 font-bold text-gray-900">
                Choose & pay
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                Select a character plan and complete your secure payment.
              </p>
            </div>

            {/* Step 3 */}
            <div className="rounded-2xl bg-gray-50 p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-lg font-bold text-purple-700">
                3
              </div>

              <h3 className="mt-4 font-bold text-gray-900">
                Generate & download
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-600">
                Your text is converted into speech and your MP3 is ready
                to download.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
<section className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
  <div className="text-center">
    <p className="text-sm font-bold uppercase tracking-[0.2em] text-purple-600">
      FAQ
    </p>

    <h2 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
      Frequently asked questions
    </h2>

    <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-gray-600">
      Everything you need to know about creating high-quality
      AI voiceovers with ProseText.
    </p>
  </div>

  <div className="mt-10 space-y-4">

    {/* 1 */}
    <details className="group rounded-2xl border border-gray-200 bg-white p-5">
      <summary className="cursor-pointer list-none pr-8 font-semibold text-gray-900 [&::-webkit-details-marker]:hidden">
        Do I need to create an account?
        <span className="float-right text-lg font-semibold text-purple-600">
          +
        </span>
      </summary>

      <p className="mt-3 pr-6 text-sm leading-6 text-gray-600">
        Yes. You need to sign in to create and download audio.
        Creating an account helps us securely process your orders
        and provide access to your generated audio.
      </p>
    </details>

    {/* 2 */}
    <details className="group rounded-2xl border border-gray-200 bg-white p-5">
      <summary className="cursor-pointer list-none pr-8 font-semibold text-gray-900 [&::-webkit-details-marker]:hidden">
        Is ProseText a subscription?
        <span className="float-right text-lg font-semibold text-purple-600">
          +
        </span>
      </summary>

      <p className="mt-3 pr-6 text-sm leading-6 text-gray-600">
        No. ProseText currently uses one-time payments.
        Choose the character plan you need and pay when you
        want to generate your audio.
      </p>
    </details>

    {/* 3 */}
    <details className="group rounded-2xl border border-gray-200 bg-white p-5">
      <summary className="cursor-pointer list-none pr-8 font-semibold text-gray-900 [&::-webkit-details-marker]:hidden">
        How do I choose a voice?
        <span className="float-right text-lg font-semibold text-purple-600">
          +
        </span>
      </summary>

      <p className="mt-3 pr-6 text-sm leading-6 text-gray-600">
        Visit the Voices page to explore the available AI voices.
        You can preview voices before selecting one for your
        text-to-speech generation.
      </p>
    </details>

    {/* 4 */}
    <details className="group rounded-2xl border border-gray-200 bg-white p-5">
      <summary className="cursor-pointer list-none pr-8 font-semibold text-gray-900 [&::-webkit-details-marker]:hidden">
        How are the pricing plans calculated?
        <span className="float-right text-lg font-semibold text-purple-600">
          +
        </span>
      </summary>

      <p className="mt-3 pr-6 text-sm leading-6 text-gray-600">
        Plans are based on the number of characters you want to
        convert into speech. Choose a plan that supports the
        length of your script before making your payment.
      </p>
    </details>

    {/* 5 */}
    <details className="group rounded-2xl border border-gray-200 bg-white p-5">
      <summary className="cursor-pointer list-none pr-8 font-semibold text-gray-900 [&::-webkit-details-marker]:hidden">
        How many audio generations do I get?
        <span className="float-right text-lg font-semibold text-purple-600">
          +
        </span>
      </summary>

      <p className="mt-3 pr-6 text-sm leading-6 text-gray-600">
        Each successful payment currently allows one audio
        generation for the selected text, plan, and voice.
      </p>
    </details>

    {/* 6 */}
    <details className="group rounded-2xl border border-gray-200 bg-white p-5">
      <summary className="cursor-pointer list-none pr-8 font-semibold text-gray-900 [&::-webkit-details-marker]:hidden">
        What payment methods can I use?
        <span className="float-right text-lg font-semibold text-purple-600">
          +
        </span>
      </summary>

      <p className="mt-3 pr-6 text-sm leading-6 text-gray-600">
        Payments are processed securely through Razorpay.
        Available payment methods are shown during checkout.
      </p>
    </details>

    {/* 7 */}
    <details className="group rounded-2xl border border-gray-200 bg-white p-5">
      <summary className="cursor-pointer list-none pr-8 font-semibold text-gray-900 [&::-webkit-details-marker]:hidden">
        What format will my audio be?
        <span className="float-right text-lg font-semibold text-purple-600">
          +
        </span>
      </summary>

      <p className="mt-3 pr-6 text-sm leading-6 text-gray-600">
        Your generated speech is provided as an MP3 audio file
        that you can download after successful generation.
      </p>
    </details>

    {/* 8 */}
    <details className="group rounded-2xl border border-gray-200 bg-white p-5">
      <summary className="cursor-pointer list-none pr-8 font-semibold text-gray-900 [&::-webkit-details-marker]:hidden">
        How long is my generated audio available?
        <span className="float-right text-lg font-semibold text-purple-600">
          +
        </span>
      </summary>

      <p className="mt-3 pr-6 text-sm leading-6 text-gray-600">
        Generated audio is temporarily available for download.
        Please download your MP3 after it has been generated.
      </p>
    </details>

    {/* 9 */}
    <details className="group rounded-2xl border border-gray-200 bg-white p-5">
      <summary className="cursor-pointer list-none pr-8 font-semibold text-gray-900 [&::-webkit-details-marker]:hidden">
        Can I preview a voice before using it?
        <span className="float-right text-lg font-semibold text-purple-600">
          +
        </span>
      </summary>

      <p className="mt-3 pr-6 text-sm leading-6 text-gray-600">
        Yes. You can visit the Voice Library and preview available
        voices before choosing one for your audio.
      </p>
    </details>

    {/* 10 */}
    <details className="group rounded-2xl border border-gray-200 bg-white p-5">
      <summary className="cursor-pointer list-none pr-8 font-semibold text-gray-900 [&::-webkit-details-marker]:hidden">
        What happens if audio generation fails after payment?
        <span className="float-right text-lg font-semibold text-purple-600">
          +
        </span>
      </summary>

      <p className="mt-3 pr-6 text-sm leading-6 text-gray-600">
        If audio generation fails, the system can retry the
        generation. If the audio cannot be successfully generated,
        the payment can be reviewed for recovery or refund.
      </p>
    </details>

  </div>
</section>

      {/* CTA */}
      <section className="bg-purple-600">
        <div className="mx-auto max-w-5xl px-4 py-14 text-center sm:px-6 lg:px-8 lg:py-16">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Ready to create your voiceover?
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-purple-100">
            Choose a plan and turn your script into natural-sounding speech.
          </p>

          <Link
            href="/#generator"
            className="mt-7 inline-flex items-center rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-purple-700 shadow-lg transition hover:bg-gray-100"
          >
            Create Audio Now
          </Link>
        </div>
      </section>
    </main>
  );
}