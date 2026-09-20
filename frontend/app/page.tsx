import Generator from "@/components/Generator";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ProseText",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Web",
  description:
    "Convert text into natural-sounding AI speech and download MP3 audio.",
  url: "https://prosetext.online",
  offers: [
    {
      "@type": "Offer",
      price: "29",
      priceCurrency: "INR",
      description: "Starter plan — up to 2,000 characters",
      url: "https://prosetext.online/pricing",
    },
    {
      "@type": "Offer",
      price: "59",
      priceCurrency: "INR",
      description: "Creator plan — up to 5,000 characters",
      url: "https://prosetext.online/pricing",
    },
    {
      "@type": "Offer",
      price: "99",
      priceCurrency: "INR",
      description: "Pro plan — up to 10,000 characters",
      url: "https://prosetext.online/pricing",
    },
    {
      "@type": "Offer",
      price: "199",
      priceCurrency: "INR",
      description: "Long plan — up to 20,000 characters",
      url: "https://prosetext.online/pricing",
    },
  ],
};

export const metadata = {
  title: "ProseText — AI Text to Speech & MP3 Generator",
  description:
    "Convert text into natural-sounding AI speech and download MP3 audio. No account required. Pay only when you generate.",
  keywords: [
    "AI text to speech",
    "text to speech",
    "AI voice generator",
    "text to voice",
    "voice generator",
    "MP3 voice generator",
    "AI voiceover",
    "voiceover generator",
    "online text to speech",
  ],
  openGraph: {
    title: "ProseText — AI Text to Speech & MP3 Generator",
    description:
      "Turn your text into natural-sounding speech and download your MP3. No signup required.",
    type: "website",
  },
};

export default function HomePage() {
  return (
    <>
      {/* SEO structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />

      <main className="min-h-screen bg-white">
        {/* =========================================================
            HERO
        ========================================================= */}
        <section className="relative overflow-hidden bg-gradient-to-b from-purple-50 via-white to-white">
          <div className="absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-purple-200/30 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-8 sm:px-6 sm:pb-10 sm:pt-10 lg:px-8 lg:pb-12 lg:pt-12">
            <div className="mx-auto max-w-4xl text-center">
              {/* Badge */}
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white px-4 py-2 text-sm font-semibold text-purple-700 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-purple-600" />
                AI-Powered Text to Speech
              </div>

              {/* Heading */}
              <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
                Turn your text into
                <span className="block text-purple-600">
                  natural-sounding speech
                </span>
              </h1>

              {/* Description */}
              <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-gray-600 sm:text-lg">
                Create high-quality AI voiceovers from your text and
                download them as MP3. No account, no subscription, and
                no complicated setup.
              </p>

              {/* CTA buttons */}
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a
                  href="#generator"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-purple-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-200 transition hover:bg-purple-700 sm:w-auto"
                >
                  Create Audio
                </a>

                <a
                  href="/pricing"
                  className="inline-flex w-full items-center justify-center rounded-xl border border-gray-300 bg-white px-7 py-3.5 text-sm font-bold text-gray-900 transition hover:border-purple-400 hover:bg-purple-50 hover:text-purple-700 sm:w-auto"
                >
                  View Pricing
                </a>
              </div>

              {/* Trust points */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-gray-500">
                <span>✓ No signup</span>
                <span>✓ Secure payment</span>
                <span>✓ MP3 download</span>
                <span>✓ Pay as you go</span>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            GENERATOR
        ========================================================= */}
        <section
          id="generator"
          className="scroll-mt-20 bg-gray-50 px-4 py-14 sm:px-6 lg:px-8 lg:py-20"
        >
          <Generator />
        </section>

        {/* =========================================================
            FEATURES
        ========================================================= */}
        <section className="bg-white px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <div className="text-sm font-bold uppercase tracking-wider text-purple-600">
                Why ProseText
              </div>

              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Simple text to speech
              </h2>

              <p className="mt-4 text-gray-600">
                Everything you need to turn a script into downloadable
                audio without unnecessary complexity.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Feature
                title="Natural AI Voices"
                description="Convert written text into natural-sounding speech for your projects."
              />

              <Feature
                title="No Account Required"
                description="Start creating immediately without registration or a complicated dashboard."
              />

              <Feature
                title="Pay As You Go"
                description="Choose a plan based on your script instead of committing to a subscription."
              />

              <Feature
                title="Download MP3"
                description="Generate your audio and download the finished MP3 file."
              />
            </div>
          </div>
        </section>

        {/* =========================================================
            HOW IT WORKS
        ========================================================= */}
        <section className="border-y border-gray-200 bg-gray-50 px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <div className="text-sm font-bold uppercase tracking-wider text-purple-600">
                How it works
              </div>

              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Create audio in three steps
              </h2>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              <Step
                number="1"
                title="Enter your text"
                description="Write or paste your script into the ProseText text box."
              />

              <Step
                number="2"
                title="Choose your plan"
                description="Select the character plan that fits the length of your text and pay securely."
              />

              <Step
                number="3"
                title="Generate & download"
                description="Your text is converted into speech and the MP3 becomes available to download."
              />
            </div>
          </div>
        </section>

        {/* =========================================================
            USE CASES
        ========================================================= */}
        <section className="bg-white px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <div className="text-sm font-bold uppercase tracking-wider text-purple-600">
                Use cases
              </div>

              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Built for creators
              </h2>

              <p className="mt-4 text-gray-600">
                Use ProseText for a wide range of voiceover and audio
                projects.
              </p>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <UseCase title="YouTube Videos" />
              <UseCase title="Social Media" />
              <UseCase title="Voiceovers" />
              <UseCase title="Story Narration" />
              <UseCase title="Educational Content" />
              <UseCase title="Explainer Videos" />
              <UseCase title="Podcasts" />
              <UseCase title="Creative Projects" />
            </div>
          </div>
        </section>

        {/* =========================================================
            FINAL CTA
        ========================================================= */}
        <section className="bg-purple-600 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Ready to turn text into speech?
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-purple-100">
              Choose a plan, generate your audio, and download your MP3.
            </p>

            <a
              href="#generator"
              className="mt-8 inline-flex items-center rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-purple-700 shadow-lg transition hover:bg-gray-100"
            >
              Start Creating
            </a>
          </div>
        </section>
      </main>
    </>
  );
}

/* ===============================================================
   FEATURE COMPONENT
=============================================================== */

function Feature({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
        <span className="text-lg font-bold">✓</span>
      </div>

      <h3 className="mt-5 text-lg font-bold text-gray-900">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-gray-600">
        {description}
      </p>
    </div>
  );
}

/* ===============================================================
   STEP COMPONENT
=============================================================== */

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-7 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-600 text-lg font-bold text-white shadow-md shadow-purple-200">
        {number}
      </div>

      <h3 className="mt-5 text-lg font-bold text-gray-900">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-gray-600">
        {description}
      </p>
    </div>
  );
}

/* ===============================================================
   USE CASE COMPONENT
=============================================================== */

function UseCase({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 text-center transition hover:border-purple-300 hover:bg-purple-50">
      <h3 className="font-semibold text-gray-900">
        {title}
      </h3>
    </div>
  );
}