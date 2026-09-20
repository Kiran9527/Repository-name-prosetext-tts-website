import Link from "next/link";

export const metadata = {
  title: "Terms of Service | ProseText",
  description:
    "Terms of Service for ProseText AI text-to-speech services.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mb-4 inline-flex items-center rounded-full bg-purple-50 px-4 py-1.5 text-sm font-semibold text-purple-700">
            Legal
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            Terms of Service
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
            {/* Agreement */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900">
                1. Agreement to These Terms
              </h2>

              <p className="mt-4">
                These Terms of Service ("Terms") govern your use of
                ProseText ("ProseText", "we", "us", or "our"), including
                our website and text-to-speech services.
              </p>

              <p className="mt-4">
                By accessing or using ProseText, you agree to be bound by
                these Terms. If you do not agree with these Terms, please
                do not use the service.
              </p>
            </section>

            {/* Service */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900">
                2. Our Service
              </h2>

              <p className="mt-4">
                ProseText provides an online service that converts
                user-provided text into computer-generated speech and
                provides the resulting audio for download.
              </p>

              <p className="mt-4">
                Features, pricing, character limits, supported formats,
                voices, and other service characteristics may change from
                time to time.
              </p>
            </section>

            {/* Eligibility */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900">
                3. Eligibility
              </h2>

              <p className="mt-4">
                You are responsible for ensuring that your use of
                ProseText complies with all laws and regulations applicable
                to you.
              </p>

              <p className="mt-4">
                If you are using ProseText on behalf of another person or
                organization, you represent that you have authority to
                accept these Terms on their behalf.
              </p>
            </section>

            {/* User content */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900">
                4. User-Provided Content
              </h2>

              <p className="mt-4">
                You are responsible for all text, scripts, and other
                content that you submit to ProseText.
              </p>

              <p className="mt-4">
                You represent that you have the necessary rights,
                permissions, and authority to use the content you submit
                and to request its conversion into audio.
              </p>

              <p className="mt-4">
                You must not submit content that you do not have the legal
                right to use.
              </p>
            </section>

            {/* Prohibited use */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900">
                5. Prohibited Uses
              </h2>

              <p className="mt-4">
                You must not use ProseText to:
              </p>

              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>Break or violate applicable laws or regulations.</li>
                <li>Infringe intellectual property or other rights.</li>
                <li>Submit content that you are not authorized to use.</li>
                <li>Attempt to bypass payment or usage restrictions.</li>
                <li>Abuse, overload, or interfere with the service.</li>
                <li>Attempt to gain unauthorized access to our systems.</li>
                <li>Use automated methods to abuse or exhaust the service.</li>
                <li>Use the service for fraudulent or deceptive activity.</li>
              </ul>
            </section>

            {/* Pricing and payments */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900">
                6. Pricing and Payments
              </h2>

              <p className="mt-4">
                ProseText currently offers pay-per-generation pricing.
                Available plans and prices are displayed on the website
                before payment.
              </p>

              <p className="mt-4">
                A successful payment authorizes the generation associated
                with the purchased plan, subject to the applicable
                character limit and service availability.
              </p>

              <p className="mt-4">
                Payments are processed through our designated payment
                provider. We may use payment transaction information to
                verify payments, prevent fraud, provide support, and
                maintain transaction records.
              </p>
            </section>

            {/* Character limits */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900">
                7. Character Limits
              </h2>

              <p className="mt-4">
                Each pricing plan has a maximum character allowance.
                Your submitted text must fit within the selected plan's
                character limit.
              </p>

              <p className="mt-4">
                ProseText may reject or prevent generation requests that
                exceed the applicable character limit.
              </p>
            </section>

            {/* Audio */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900">
                8. Generated Audio
              </h2>

              <p className="mt-4">
                ProseText provides generated audio for the user's requested
                text. AI-generated speech may contain pronunciation,
                emphasis, timing, or other imperfections.
              </p>

              <p className="mt-4">
                You are responsible for reviewing generated audio before
                using it in commercial, public, or other important
                applications.
              </p>
            </section>

            {/* Intellectual property */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900">
                9. Intellectual Property
              </h2>

              <p className="mt-4">
                The ProseText website, branding, software, design, and
                related materials may be protected by intellectual
                property laws and remain the property of ProseText or its
                respective licensors.
              </p>

              <p className="mt-4">
                You retain responsibility for the text and other content
                that you submit to the service.
              </p>

              <p className="mt-4">
                Your use of generated audio is also subject to any
                applicable rights, restrictions, or terms imposed by the
                underlying technology and service providers.
              </p>
            </section>

            {/* Third-party services */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900">
                10. Third-Party Services
              </h2>

              <p className="mt-4">
                ProseText may rely on third-party services for functions
                such as payment processing, text-to-speech generation,
                hosting, storage, security, analytics, and other
                infrastructure.
              </p>

              <p className="mt-4">
                Your use of certain third-party services may also be
                subject to the applicable terms and policies of those
                providers.
              </p>
            </section>

            {/* Availability */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900">
                11. Service Availability
              </h2>

              <p className="mt-4">
                We aim to keep ProseText available and reliable, but we do
                not guarantee that the service will always be available,
                uninterrupted, error-free, or compatible with every device
                or browser.
              </p>

              <p className="mt-4">
                Service availability may be affected by maintenance,
                technical failures, third-party provider outages, network
                issues, or circumstances outside our reasonable control.
              </p>
            </section>

            {/* Refunds */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900">
                12. Refunds
              </h2>

              <p className="mt-4">
                Refunds are handled according to the ProseText Refund
                Policy and applicable payment rules.
              </p>

              <p className="mt-4">
                If you experience a payment problem or a paid generation
                fails, please contact support with the relevant payment
                information so the transaction can be reviewed.
              </p>

              <Link
                href="/refund"
                className="mt-4 inline-flex font-semibold text-purple-600 hover:text-purple-700"
              >
                View Refund Policy →
              </Link>
            </section>

            {/* Disclaimer */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900">
                13. Disclaimer
              </h2>

              <p className="mt-4">
                ProseText is provided on an "as available" basis to the
                extent permitted by applicable law.
              </p>

              <p className="mt-4">
                We do not guarantee that generated speech will always be
                accurate, natural, error-free, or suitable for a
                particular purpose.
              </p>

              <p className="mt-4">
                You are responsible for determining whether the generated
                audio is appropriate for your intended use.
              </p>
            </section>

            {/* Limitation */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900">
                14. Limitation of Liability
              </h2>

              <p className="mt-4">
                To the maximum extent permitted by applicable law,
                ProseText and its operators, affiliates, and service
                providers will not be responsible for indirect,
                incidental, special, consequential, or similar damages
                arising from your use of the service.
              </p>

              <p className="mt-4">
                Nothing in these Terms is intended to exclude or limit
                liability that cannot legally be excluded or limited
                under applicable law.
              </p>
            </section>

            {/* Termination */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900">
                15. Suspension or Termination
              </h2>

              <p className="mt-4">
                We may suspend or restrict access to ProseText where
                reasonably necessary to protect the service, users, our
                systems, or third-party providers, or where we reasonably
                believe these Terms have been violated.
              </p>
            </section>

            {/* Changes */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900">
                16. Changes to These Terms
              </h2>

              <p className="mt-4">
                We may update these Terms from time to time. Updated
                Terms will be posted on this page and the "Last updated"
                date will be changed.
              </p>

              <p className="mt-4">
                Your continued use of ProseText after changes are posted
                may be subject to the updated Terms.
              </p>
            </section>

            {/* Governing law */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900">
                17. Governing Law
              </h2>

              <p className="mt-4">
                These Terms will be interpreted and applied in accordance
                with applicable laws. Any specific governing law or
                jurisdiction provisions should be finalized based on the
                legal structure and location of the ProseText business.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900">
                18. Contact Us
              </h2>

              <p className="mt-4">
                If you have questions about these Terms or the ProseText
                service, please contact our support team.
              </p>

              <p className="mt-4 font-semibold text-gray-900">
                Email: support@prosetext.online
              </p>

              <p className="mt-2 text-gray-500">
                Replace this placeholder email with your actual business
                support email before launching the website.
              </p>
            </section>
          </div>
        </article>

        {/* Bottom navigation */}
        <div className="mt-8 flex flex-col items-center justify-center gap-4 text-sm sm:flex-row">
          <Link
            href="/privacy"
            className="font-semibold text-purple-600 hover:text-purple-700"
          >
            Privacy Policy
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