import Link from "next/link";

export const metadata = {
  title: "Refund Policy | ProseText",
  description:
    "Refund Policy for ProseText AI text-to-speech services.",
};

export default function RefundPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mb-4 inline-flex items-center rounded-full bg-purple-50 px-4 py-1.5 text-sm font-semibold text-purple-700">
            Legal
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            Refund Policy
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
            {/* Overview */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900">
                1. Overview
              </h2>

              <p className="mt-4">
                ProseText provides pay-per-generation text-to-speech
                services. Because the service involves processing your
                text and using third-party technology to generate audio,
                refund eligibility depends on whether the purchased
                generation was successfully delivered.
              </p>
            </section>

            {/* Eligible refunds */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900">
                2. When a Refund May Be Available
              </h2>

              <p className="mt-4">
                A refund may be considered when a successful payment was
                made but ProseText was unable to provide the purchased
                audio generation because of a technical failure on our
                side.
              </p>

              <p className="mt-4">
                Examples may include:
              </p>

              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>
                  Payment was successfully completed but the generation
                  failed because of a ProseText server error.
                </li>
                <li>
                  A confirmed payment was received but the requested
                  audio could not be generated because of an internal
                  service failure.
                </li>
                <li>
                  A technical issue prevented delivery of the generated
                  audio after payment.
                </li>
              </ul>
            </section>

            {/* Failed generation */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900">
                3. Failed Audio Generation
              </h2>

              <p className="mt-4">
                If your payment succeeds but audio generation fails,
                please contact support as soon as possible.
              </p>

              <p className="mt-4">
                We may first attempt to resolve the technical issue or
                provide the generation associated with the successful
                payment. If the paid service cannot reasonably be
                delivered, a refund may be issued according to the
                circumstances of the transaction.
              </p>
            </section>

            {/* Successful generation */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900">
                4. Successfully Generated Audio
              </h2>

              <p className="mt-4">
                Refunds are generally not available solely because a user
                does not like the generated voice, pronunciation, pacing,
                accent, or other characteristics of AI-generated speech
                after a generation has been successfully completed.
              </p>

              <p className="mt-4">
                AI-generated speech can vary depending on the text and
                may not always match a user's expectations.
              </p>
            </section>

            {/* User error */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900">
                5. User-Submitted Text
              </h2>

              <p className="mt-4">
                Users are responsible for reviewing their text before
                submitting a generation request.
              </p>

              <p className="mt-4">
                Refunds may not be available for mistakes in
                user-provided text, including spelling errors, incorrect
                scripts, unintended wording, or other content supplied by
                the user.
              </p>
            </section>

            {/* Duplicate payments */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900">
                6. Duplicate or Incorrect Payments
              </h2>

              <p className="mt-4">
                If you believe you were charged more than once for the
                same transaction or encountered an incorrect payment
                charge, contact support with the relevant payment IDs.
              </p>

              <p className="mt-4">
                We will review the transaction and, where appropriate,
                process a refund for a verified duplicate or incorrect
                charge.
              </p>
            </section>

            {/* Refund process */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900">
                7. How to Request a Refund
              </h2>

              <p className="mt-4">
                To request a refund review, contact ProseText support and
                provide:
              </p>

              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>Your payment ID.</li>
                <li>The approximate date and time of payment.</li>
                <li>The issue you experienced.</li>
                <li>
                  Any relevant error message or information about the
                  failed generation.
                </li>
              </ul>

              <p className="mt-4">
                Providing accurate transaction information helps us
                investigate your request more quickly.
              </p>
            </section>

            {/* Processing */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900">
                8. Refund Processing
              </h2>

              <p className="mt-4">
                Approved refunds will generally be processed through the
                applicable payment provider or original payment method,
                subject to the provider's processing procedures.
              </p>

              <p className="mt-4">
                The time required for a refund to appear in your account
                may depend on your bank, card issuer, payment provider,
                or other financial institution.
              </p>
            </section>

            {/* Non-refundable situations */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900">
                9. Situations That May Not Qualify
              </h2>

              <p className="mt-4">
                A refund may not be available where:
              </p>

              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>
                  The audio generation was successfully completed.
                </li>
                <li>
                  The issue resulted from incorrect text supplied by the
                  user.
                </li>
                <li>
                  The user exceeded or misunderstood the applicable plan
                  character limit.
                </li>
                <li>
                  The service was used in violation of our Terms of
                  Service.
                </li>
                <li>
                  A request is made without sufficient transaction
                  information to verify the payment.
                </li>
              </ul>
            </section>

            {/* Policy changes */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900">
                10. Changes to This Refund Policy
              </h2>

              <p className="mt-4">
                We may update this Refund Policy from time to time.
                Changes will be posted on this page and the "Last
                updated" date will be revised.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900">
                11. Contact Us
              </h2>

              <p className="mt-4">
                For refund questions or payment-related problems, please
                contact ProseText support.
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
            href="/terms"
            className="font-semibold text-purple-600 hover:text-purple-700"
          >
            Terms of Service
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