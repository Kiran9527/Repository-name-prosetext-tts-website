import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | ProseText",
  description:
    "Privacy Policy for ProseText, an AI text-to-speech service.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mb-4 inline-flex items-center rounded-full bg-purple-50 px-4 py-1.5 text-sm font-semibold text-purple-700">
            Legal
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            Privacy Policy
          </h1>

          <p className="mt-4 text-sm text-gray-500">
            Last updated: September 9, 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <article className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="space-y-10 text-sm leading-7 text-gray-600">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900">
                1. Introduction
              </h2>

              <p className="mt-4">
                ProseText ("ProseText", "we", "us", or "our") provides an
                online text-to-speech service that converts user-provided
                text into audio.
              </p>

              <p className="mt-4">
                This Privacy Policy explains what information may be
                collected when you use ProseText, how that information is
                used, and the choices available to you.
              </p>

              <p className="mt-4">
                By using ProseText, you acknowledge the practices described
                in this Privacy Policy.
              </p>
            </section>

            {/* Information collected */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900">
                2. Information We May Collect
              </h2>

              <h3 className="mt-5 font-semibold text-gray-900">
                Text and content
              </h3>

              <p className="mt-2">
                When you use our text-to-speech service, you provide text
                that needs to be converted into speech. This text may be
                temporarily processed by our servers and by our third-party
                text-to-speech provider to generate the requested audio.
              </p>

              <h3 className="mt-5 font-semibold text-gray-900">
                Payment information
              </h3>

              <p className="mt-2">
                Payments are processed through our payment service provider.
                ProseText does not need to receive or store your complete
                card, banking, or other sensitive payment credentials.
              </p>

              <h3 className="mt-5 font-semibold text-gray-900">
                Technical information
              </h3>

              <p className="mt-2">
                Our infrastructure or service providers may process
                technical information such as IP address, browser type,
                device information, timestamps, request information, and
                error logs for security, troubleshooting, and service
                operation.
              </p>
            </section>

            {/* How information is used */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900">
                3. How We Use Information
              </h2>

              <p className="mt-4">
                Information may be used to:
              </p>

              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>Process text-to-speech requests.</li>
                <li>Generate and provide requested audio files.</li>
                <li>Process and verify payments.</li>
                <li>Prevent fraud, abuse, and unauthorized activity.</li>
                <li>Maintain and improve the service.</li>
                <li>Diagnose technical problems and errors.</li>
                <li>Respond to customer support requests.</li>
                <li>Comply with applicable legal obligations.</li>
              </ul>
            </section>

            {/* Third party providers */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900">
                4. Third-Party Service Providers
              </h2>

              <p className="mt-4">
                ProseText may use third-party providers to operate parts of
                the service. These providers may process information only
                as necessary to provide their services or as otherwise
                permitted by their applicable terms and privacy policies.
              </p>

              <p className="mt-4">
                These providers may include payment processing services,
                text-to-speech infrastructure, hosting providers, storage
                providers, analytics services, security services, and other
                infrastructure providers.
              </p>
            </section>

            {/* Audio and text retention */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900">
                5. Text and Audio Retention
              </h2>

              <p className="mt-4">
                ProseText is designed to process text and generate audio as
                part of the requested service. Depending on our technical
                architecture, generated audio and related request data may
                be stored temporarily for processing, delivery, security,
                troubleshooting, or fraud prevention.
              </p>

              <p className="mt-4">
                We aim to retain temporary service data only for as long as
                reasonably necessary for the purpose for which it was
                collected.
              </p>

              <p className="mt-4">
                Do not submit highly confidential, sensitive, or
                unnecessary personal information into the text-to-speech
                field.
              </p>
            </section>

            {/* Security */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900">
                6. Data Security
              </h2>

              <p className="mt-4">
                We take reasonable technical and organizational measures
                designed to protect information against unauthorized
                access, alteration, disclosure, or destruction.
              </p>

              <p className="mt-4">
                However, no internet transmission or electronic storage
                system can be guaranteed to be completely secure.
              </p>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900">
                7. Cookies and Similar Technologies
              </h2>

              <p className="mt-4">
                ProseText or its service providers may use cookies,
                local storage, or similar technologies where necessary for
                website functionality, security, analytics, or improving
                the user experience.
              </p>

              <p className="mt-4">
                You can control certain cookies through your browser
                settings. Disabling some technologies may affect website
                functionality.
              </p>
            </section>

            {/* Children's privacy */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900">
                8. Children's Privacy
              </h2>

              <p className="mt-4">
                ProseText is not intended to knowingly collect personal
                information from children where such collection is
                prohibited by applicable law.
              </p>

              <p className="mt-4">
                If you believe that a child has provided personal
                information to us, please contact us so that appropriate
                action can be considered.
              </p>
            </section>

            {/* User rights */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900">
                9. Your Privacy Choices
              </h2>

              <p className="mt-4">
                Depending on your location and applicable law, you may
                have rights relating to your personal information, such as
                requesting access, correction, deletion, restriction, or
                other applicable privacy rights.
              </p>

              <p className="mt-4">
                To make a privacy-related request, contact us using the
                support information provided on our Contact page.
              </p>
            </section>

            {/* Changes */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900">
                10. Changes to This Policy
              </h2>

              <p className="mt-4">
                We may update this Privacy Policy from time to time.
                Changes will be reflected by updating the "Last updated"
                date at the top of this page.
              </p>

              <p className="mt-4">
                Your continued use of ProseText after an updated policy is
                published may be subject to the revised policy.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900">
                11. Contact Us
              </h2>

              <p className="mt-4">
                If you have questions or concerns about this Privacy
                Policy, please contact ProseText support.
              </p>

              <p className="mt-4 font-semibold text-gray-900">
                Email: support@prosetext.online
              </p>

              <p className="mt-2 text-gray-500">
                Please replace this placeholder email with your actual
                business support email before launching the website.
              </p>
            </section>
          </div>
        </article>

        {/* Bottom navigation */}
        <div className="mt-8 flex flex-col items-center justify-center gap-4 text-sm sm:flex-row">
          <Link
            href="/terms"
            className="font-semibold text-purple-600 hover:text-purple-700"
          >
            Terms of Service
          </Link>

          <span className="hidden text-gray-300 sm:inline">•</span>

          <Link
            href="/refund"
            className="font-semibold text-purple-600 hover:text-purple-700"
          >
            Refund Policy
          </Link>

          <span className="hidden text-gray-300 sm:inline">•</span>

          <Link
            href="/contact"
            className="font-semibold text-purple-600 hover:text-purple-700"
          >
            Contact Support
          </Link>
        </div>
      </section>
    </main>
  );
}