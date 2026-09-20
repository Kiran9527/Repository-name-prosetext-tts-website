"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getSession } from "@/lib/supabase-auth";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const MAX_CHARS = 20000;

type Plan = {
  id: string;
  name: string;
  price: number;
  currency: string;
  included_characters: number;
  max_characters: number;
  is_active: boolean;
  offer_price: number | null;
  offer_start: string | null;
  offer_end: string | null;
};

type Voice = {
  id: string;
  name: string;
  provider: string;
  provider_voice_id: string;
  language_code: string;
  language_name: string;
  category: string;
  description: string;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
};

declare global {
  interface Window {
    Razorpay: any;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true));
      existingScript.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");

    script.src =
      "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;

    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
}

function getEffectivePrice(plan: Plan) {
  const basePrice = Number(plan.price);

  const offerPrice =
    plan.offer_price !== null
      ? Number(plan.offer_price)
      : null;

  // Admin Pricing is the single source of truth.
  // If an offer price is configured and is lower
  // than the regular price, use it regardless of
  // offer_start / offer_end dates.
  if (
    offerPrice !== null &&
    Number.isFinite(offerPrice) &&
    offerPrice >= 0 &&
    offerPrice < basePrice
  ) {
    return offerPrice;
  }

  return basePrice;
}
function getDisplayVoiceName(name: string) {
  const parts = name.split("-");

  if (parts.length < 3) {
    return name;
  }

  // Chirp3-HD / Chirp-HD
  // ar-XA-Chirp3-HD-Umbriel -> HD-Umbriel
  // ar-XA-Chirp-HD-Umbriel  -> HD-Umbriel
  if (
    parts[2] === "Chirp3" ||
    parts[2] === "Chirp"
  ) {
    return parts.slice(3).join("-");
  }

  // Standard / Wavenet / Neural2 / Studio / etc.
  // ar-XA-Standard-A -> Standard-A
  // ar-XA-Wavenet-A -> Wavenet-A
  return parts.slice(2).join("-");
}
export default function Generator() {
  const [text, setText] = useState("");

  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] =
    useState<Plan | null>(null);

  const [pricingLoading, setPricingLoading] =
    useState(true);

  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] =
    useState<Voice | null>(null);

  const [voicesLoading, setVoicesLoading] =
    useState(true);

  const [playingVoiceId, setPlayingVoiceId] =
    useState<string | null>(null);

  const previewAudioRef =
    useRef<HTMLAudioElement | null>(null);

  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [downloadUrl, setDownloadUrl] =
    useState("");

  const characterCount = text.length;

  const isOverLimit =
    characterCount > MAX_CHARS;

  const textTooLongForPlan =
    selectedPlan !== null &&
    characterCount > selectedPlan.max_characters;

  const canStartPayment =
    selectedPlan !== null &&
    selectedVoice !== null &&
    characterCount > 0 &&
    !isOverLimit &&
    !textTooLongForPlan &&
    !loading &&
    !paymentLoading &&
    !pricingLoading &&
    !voicesLoading;

  /*
   * ============================================================
   * LOAD PRICING
   * ============================================================
   */

  useEffect(() => {
    async function loadPricing() {
      try {
        setPricingLoading(true);

        const response = await fetch(
          `${API_URL}/pricing?t=${Date.now()}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok || !data?.success) {
          throw new Error(
            data?.detail ||
              "Unable to load pricing plans."
          );
        }

        const activePlans: Plan[] =
          Array.isArray(data?.plans)
            ? data.plans
            : [];

        setPlans(activePlans);

        if (activePlans.length > 0) {
          setSelectedPlan(activePlans[0]);
        } else {
          setSelectedPlan(null);
        }
      } catch (err) {
        console.error(
          "Pricing load error:",
          err
        );

        setPlans([]);
        setSelectedPlan(null);

        setError(
          "Unable to load pricing plans. Please try again."
        );
      } finally {
        setPricingLoading(false);
      }
    }

    loadPricing();
  }, []);

  /*
   * ============================================================
   * LOAD VOICES
   * ============================================================
   */

  useEffect(() => {
    async function loadVoices() {
      try {
        setVoicesLoading(true);

        const response = await fetch(
          `${API_URL}/voices?t=${Date.now()}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok || !data?.success) {
          throw new Error(
            data?.detail ||
              "Unable to load voices."
          );
        }

        const activeVoices: Voice[] =
          Array.isArray(data?.voices)
            ? data.voices
            : [];

        setVoices(activeVoices);

        /*
         * Check whether a voice was selected from
         * the Voice Library page.
         */
        const requestedVoiceId =
          typeof window !== "undefined"
            ? new URLSearchParams(
                window.location.search
              ).get("voice")
            : null;

        const requestedVoice = requestedVoiceId
          ? activeVoices.find(
              (voice) =>
                voice.id === requestedVoiceId
            )
          : null;

        if (requestedVoice) {
          setSelectedVoice(requestedVoice);
        } else if (activeVoices.length > 0) {
          setSelectedVoice(activeVoices[0]);
        } else {
          setSelectedVoice(null);
        }
      } catch (err) {
        console.error(
          "Voice load error:",
          err
        );

        setVoices([]);
        setSelectedVoice(null);

        setError(
          "Unable to load voices. Please try again."
        );
      } finally {
        setVoicesLoading(false);
      }
    }

    loadVoices();
  }, []);

  /*
   * ============================================================
   * RECOMMENDED PLAN
   * ============================================================
   */

  const recommendedPlan = useMemo(() => {
    if (plans.length === 0) {
      return null;
    }

    return (
      plans.find(
        (plan) =>
          characterCount <= plan.max_characters
      ) || plans[plans.length - 1]
    );
  }, [characterCount, plans]);

  /*
   * ============================================================
   * SAMPLE VOICES
   * ============================================================
   */

  const sampleVoices = useMemo(() => {
    const featured = voices.filter(
      (voice) => voice.is_featured
    );

    const baseVoices =
      featured.length > 0
        ? featured
        : voices;

    const firstSix = baseVoices.slice(0, 6);

    if (
      selectedVoice &&
      !firstSix.some(
        (voice) =>
          voice.id === selectedVoice.id
      )
    ) {
      return [
        selectedVoice,
        ...firstSix.slice(0, 5),
      ];
    }

    return firstSix;
  }, [voices, selectedVoice]);

  /*
   * ============================================================
   * TEXT CHANGE
   * ============================================================
   */

  function handleTextChange(
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) {
    setText(event.target.value);

    setError("");
    setSuccess("");
    setDownloadUrl("");
  }

  /*
   * ============================================================
   * SELECT PLAN
   * ============================================================
   */

  function selectPlan(plan: Plan) {
    setSelectedPlan(plan);

    setError("");
    setSuccess("");
    setDownloadUrl("");
  }

  /*
   * ============================================================
   * SELECT VOICE
   * ============================================================
   */

  function selectVoice(voice: Voice) {
    setSelectedVoice(voice);

    setError("");
    setSuccess("");
    setDownloadUrl("");
  }

  /*
   * ============================================================
   * PLAY VOICE SAMPLE
   * ============================================================
   */

  async function playVoiceSample(voice: Voice) {
    setError("");

    if (
      playingVoiceId === voice.id &&
      previewAudioRef.current
    ) {
      previewAudioRef.current.pause();
      previewAudioRef.current.currentTime = 0;
      previewAudioRef.current = null;
      setPlayingVoiceId(null);
      return;
    }

    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.currentTime = 0;
      previewAudioRef.current = null;
    }

    let audioUrl = "";

    try {
      setPlayingVoiceId(voice.id);

      const response = await fetch(
        `${API_URL}/preview`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            voice_id: voice.id,
            text: "Hello, this is a preview of this voice.",
          }),
        }
      );

      if (!response.ok) {
        let message =
          "Unable to generate voice preview.";

        try {
          const data = await response.json();

          if (data?.detail) {
            message = data.detail;
          }
        } catch {
          // Ignore JSON parsing errors.
        }

        throw new Error(message);
      }

      const audioBlob = await response.blob();

      if (!audioBlob.size) {
        throw new Error(
          "Voice preview returned empty audio."
        );
      }

      audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);

      previewAudioRef.current = audio;

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);

        if (previewAudioRef.current === audio) {
          previewAudioRef.current = null;
          setPlayingVoiceId(null);
        }
      };

      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);

        if (previewAudioRef.current === audio) {
          previewAudioRef.current = null;
          setPlayingVoiceId(null);
        }

        setError(
          "Unable to play this voice preview."
        );
      };

      await audio.play();
    } catch (err) {
      console.error(
        "Voice preview failed:",
        err
      );

      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current.currentTime = 0;
        previewAudioRef.current = null;
      }

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }

      setPlayingVoiceId(null);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to generate voice preview."
      );
    }
  }

  useEffect(() => {
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current.currentTime = 0;
        previewAudioRef.current = null;
      }
    };
  }, []);

  /*
   * ============================================================
   * CREATE ORDER
   * ============================================================
   */

  async function createOrder() {
    if (!selectedPlan) {
      throw new Error(
        "Please select a pricing plan."
      );
    }

    if (!selectedVoice) {
      throw new Error(
        "Please select a voice."
      );
    }

    const session = getSession();

    if (!session?.access_token) {
      throw new Error(
        "Please log in before creating an order."
      );
    }

    const response = await fetch(
      `${API_URL}/create-order`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          text,
          plan_id: selectedPlan.id,

          // Google Cloud provider voice ID
          voice_id:
            selectedVoice.provider_voice_id,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.detail ||
          "Unable to create payment order."
      );
    }

    return data;
  }

  /*
   * ============================================================
   * VERIFY PAYMENT
   * ============================================================
   */

  async function verifyPayment(
    internalOrderId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ) {
    const session = getSession();

    if (!session?.access_token) {
      throw new Error(
        "Your session has expired. Please log in again."
      );
    }

    const response = await fetch(
      `${API_URL}/verify-payment`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          order_id: internalOrderId,
          razorpay_order_id:
            razorpayOrderId,
          razorpay_payment_id:
            razorpayPaymentId,
          razorpay_signature:
            razorpaySignature,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.detail ||
          "Payment verification failed."
      );
    }

    return data;
  }

  /*
   * ============================================================
   * GENERATE AUDIO
   * ============================================================
   */

  async function generateAudio(
    internalOrderId: string
  ) {
    const session = getSession();

    if (!session?.access_token) {
      setError(
        "Your session has expired. Please log in again."
      );

      setSuccess("");
      return;
    }

    setLoading(true);
    setError("");

    setSuccess(
      "Payment successful. Generating your audio..."
    );

    try {
      const response = await fetch(
        `${API_URL}/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            order_id: internalOrderId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Audio generation failed."
        );
      }

      const url =
        data.download_url.startsWith(
          "http"
        )
          ? data.download_url
          : `${API_URL}${data.download_url}`;

      setDownloadUrl(url);

      setSuccess(
        "Audio generated successfully. Your MP3 is ready."
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Audio generation failed.";

      setError(message);
      setSuccess("");
    } finally {
      setLoading(false);
    }
  }

  /*
   * ============================================================
   * DOWNLOAD
   * ============================================================
   */

  async function handleDownload() {
    if (!downloadUrl) {
      setError(
        "Download link is not available."
      );
      return;
    }

    const session = getSession();

    if (!session?.access_token) {
      setError(
        "Your session has expired. Please log in again."
      );
      return;
    }

    setError("");

    try {
      /*
       * 1. Ask backend for a fresh secure
       *    Supabase signed URL.
       */
      const response = await fetch(
        downloadUrl,
        {
          method: "GET",
          headers: {
            Authorization:
              `Bearer ${session.access_token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Unable to prepare your download."
        );
      }

      if (!data.download_url) {
        throw new Error(
          "Secure download link was not returned."
        );
      }

      /*
       * Backend must return order_id.
       */
      if (!data.order_id) {
        throw new Error(
          "Download order ID was not returned."
        );
      }

      /*
       * 2. Download actual MP3 into browser.
       */
      const audioResponse =
        await fetch(data.download_url);

      if (!audioResponse.ok) {
        throw new Error(
          "Unable to download the audio file."
        );
      }

      const blob =
        await audioResponse.blob();

      if (!blob.size) {
        throw new Error(
          "Downloaded audio file is empty."
        );
      }

      /*
       * 3. Create browser download.
       */
      const objectUrl =
        window.URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = objectUrl;

      link.download =
        data.file_name ||
        "ProseText-audio.mp3";

      document.body.appendChild(link);

      link.click();

      link.remove();

      /*
       * Give browser enough time to start
       * processing the download.
       */
      setTimeout(() => {
        window.URL.revokeObjectURL(
          objectUrl
        );
      }, 1000);

      /*
       * 4. Tell backend the download has
       *    successfully reached the browser.
       *
       * Backend will then delete the MP3
       * from Supabase Storage.
       */
      try {
        const cleanupResponse =
          await fetch(
            `${API_URL}/download-complete/${data.order_id}`,
            {
              method: "POST",
              headers: {
                Authorization:
                  `Bearer ${session.access_token}`,
              },
            }
          );

        if (!cleanupResponse.ok) {
          console.error(
            "Download cleanup failed:",
            await cleanupResponse.text()
          );
        }
      } catch (cleanupError) {
        /*
         * Do not show an error to the user
         * because the actual MP3 download
         * already succeeded.
         *
         * The 5-minute cleanup process will
         * remove the file as a fallback.
         */
        console.error(
          "Download cleanup request failed:",
          cleanupError
        );
      }

      /*
       * Hide the download button after successful
       * download because the file is now deleted.
       */
      setDownloadUrl("");

      setSuccess(
        "MP3 downloaded successfully."
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Download failed.";

      setError(message);
    }
  }

  /*
   * ============================================================
   * START PAYMENT
   * ============================================================
   */

  async function startPayment() {
    if (!selectedPlan) {
      setError(
        "Please select a pricing plan."
      );
      return;
    }

    if (!selectedVoice) {
      setError("Please select a voice.");
      return;
    }

    if (!text.trim()) {
      setError(
        "Please enter some text first."
      );
      return;
    }

    if (isOverLimit) {
      setError(
        `Maximum ${MAX_CHARS.toLocaleString()} characters allowed.`
      );
      return;
    }

    if (textTooLongForPlan) {
      setError(
        `${selectedPlan.name} supports only ${selectedPlan.max_characters.toLocaleString()} characters. Please select a larger plan.`
      );
      return;
    }

    const session = getSession();

    if (!session?.access_token) {
      window.location.href = "/login";
      return;
    }

    setError("");
    setSuccess("");
    setDownloadUrl("");
    setPaymentLoading(true);

    try {
      const razorpayLoaded =
        await loadRazorpayScript();

      if (!razorpayLoaded) {
        throw new Error(
          "Razorpay could not be loaded. Please check your internet connection and try again."
        );
      }

      const order = await createOrder();

      const selectedPrice =
        getEffectivePrice(
          selectedPlan
        );

      const options = {
        key: order.key_id,

        amount: order.amount,

        currency: order.currency,

        name: "ProseText",

        description:
          `${selectedPlan.name} — ${getDisplayVoiceName(selectedVoice.name)}`,

        order_id:
          order.razorpay_order_id,

        handler:
          async function (
            response: any
          ) {
            try {
              setPaymentLoading(true);

              setError("");

              setSuccess(
                "Verifying your payment..."
              );

              await verifyPayment(
                order.order_id,
                response.razorpay_order_id,
                response.razorpay_payment_id,
                response.razorpay_signature
              );

              await generateAudio(
                order.order_id
              );
            } catch (err) {
              const message =
                err instanceof Error
                  ? err.message
                  : "Payment verification failed.";

              setError(message);
              setSuccess("");
            } finally {
              setPaymentLoading(false);
            }
          },

        modal: {
          ondismiss:
            function () {
              setPaymentLoading(
                false
              );

              setSuccess("");
            },
        },

        theme: {
          color: "#7c3aed",
        },

        notes: {
          voice:
            selectedVoice.name,

          voice_id:
            selectedVoice.provider_voice_id,

          plan:
            selectedPlan.name,

          price:
            selectedPrice.toString(),
        },
      };

      const razorpay =
        new window.Razorpay(
          options
        );

      razorpay.on(
        "payment.failed",
        function (
          response: any
        ) {
          setPaymentLoading(false);

          setError(
            response?.error
              ?.description ||
              "Payment failed. Please try again."
          );

          setSuccess("");
        }
      );

      razorpay.open();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to start payment.";

      setError(message);

      setSuccess("");

      setPaymentLoading(false);
    }
  }

  /*
   * ============================================================
   * LOADING PRICING
   * ============================================================
   */

  if (pricingLoading) {
    return (
      <section
        id="generator"
        className="w-full"
      >
        <div className="mx-auto max-w-5xl">
          <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-xl">
            <div className="text-lg font-semibold text-gray-900">
              Loading pricing...
            </div>

            <p className="mt-2 text-sm text-gray-500">
              Please wait while we load the available plans.
            </p>
          </div>
        </div>
      </section>
    );
  }

  /*
   * ============================================================
   * NO PRICING
   * ============================================================
   */

  if (!selectedPlan) {
    return (
      <section
        id="generator"
        className="w-full"
      >
        <div className="mx-auto max-w-5xl">
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
            <div className="font-semibold text-red-800">
              Pricing is currently unavailable.
            </div>

            <p className="mt-2 text-sm text-red-600">
              Please refresh the page and try again.
            </p>
          </div>
        </div>
      </section>
    );
  }

  /*
   * ============================================================
   * MAIN GENERATOR
   * ============================================================
   */

  return (
    <section
      id="generator"
      className="w-full"
    >
      <div className="mx-auto max-w-5xl">
        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-xl sm:p-8">

          {/* HEADER */}

          <div className="mb-6">
            <div className="mb-2 inline-flex items-center rounded-full bg-purple-50 px-3 py-1 text-sm font-medium text-purple-700">
              AI Text to Speech
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Create natural-sounding speech
            </h2>

            <p className="mt-2 text-gray-600">
              Enter your text, choose a voice,
              select a plan, pay securely, and
              generate your MP3 audio.
            </p>
          </div>

          {/* TEXT */}

          <div className="mb-8">
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="ProseText-text"
                className="text-sm font-semibold text-gray-800"
              >
                Your text
              </label>

              <span
                className={`text-sm ${
                  isOverLimit
                    ? "font-semibold text-red-600"
                    : "text-gray-500"
                }`}
              >
                {characterCount.toLocaleString()} /{" "}
                {MAX_CHARS.toLocaleString()}
              </span>
            </div>

            <textarea
              id="ProseText-text"
              value={text}
              onChange={handleTextChange}
              placeholder="Write or paste your text here..."
              rows={12}
              maxLength={MAX_CHARS}
              className="w-full resize-y rounded-2xl border border-gray-300 bg-gray-50 p-4 text-base text-gray-900 outline-none transition focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-100"
            />

            {isOverLimit && (
              <p className="mt-2 text-sm font-medium text-red-600">
                Your text exceeds the maximum character limit.
              </p>
            )}
          </div>

          {/* SAMPLE PREVIEW VOICES */}

          <div className="mb-8">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Sample Preview Voices
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Listen to a sample and choose the
                  voice for your audio.
                </p>
              </div>

              <a
                href="/voices"
                className="hidden text-sm font-semibold text-purple-600 hover:text-purple-700 sm:block"
              >
                View all voices →
              </a>
            </div>

            {voicesLoading ? (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center">
                <div className="font-semibold text-gray-800">
                  Loading voices...
                </div>

                <p className="mt-1 text-sm text-gray-500">
                  Please wait while we load the available voices.
                </p>
              </div>
            ) : voices.length === 0 ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
                <div className="font-semibold text-red-800">
                  No voices are currently available.
                </div>

                <p className="mt-1 text-sm text-red-600">
                  Please refresh the page and try again.
                </p>
              </div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {sampleVoices.map(
                    (voice) => {
                      const selected =
                        selectedVoice?.id ===
                        voice.id;

                      const playing =
                        playingVoiceId ===
                        voice.id;

                      return (
                        <div
                          key={voice.id}
                          className={`rounded-2xl border p-4 transition ${
                            selected
                              ? "border-purple-600 bg-purple-50 ring-2 ring-purple-200"
                              : "border-gray-200 bg-white hover:border-purple-300"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h4 className="truncate font-semibold text-gray-900">
                                {getDisplayVoiceName(voice.name)}
                              </h4>

                              <div className="mt-1 flex flex-wrap gap-2">
                                {voice.language_name && (
                                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                                    {voice.language_name.toUpperCase()}
                                  </span>
                                )}

                                {voice.category && (
                                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium capitalize text-gray-600">
                                    {voice.category}
                                  </span>
                                )}
                              </div>
                            </div>

                            {selected && (
                              <span className="shrink-0 rounded-full bg-purple-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                                Selected
                              </span>
                            )}
                          </div>

                          <p className="mt-3 line-clamp-2 text-xs leading-5 text-gray-500">
                            {voice.description ||
                              "Natural-sounding AI voice."}
                          </p>

                          <div className="mt-4 flex gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                playVoiceSample(
                                  voice
                                )
                              }
                              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 transition hover:border-purple-400 hover:text-purple-700"
                            >
                              <span aria-hidden="true">
                                {playing
                                  ? "❚❚"
                                  : "▶"}
                              </span>

                              {playing
                                ? "Playing..."
                                : "Preview"}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                selectVoice(
                                  voice
                                )
                              }
                              className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                                selected
                                  ? "bg-purple-600 text-white"
                                  : "bg-gray-900 text-white hover:bg-gray-800"
                              }`}
                            >
                              {selected
                                ? "Selected"
                                : "Use Voice"}
                            </button>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>

                <a
                  href="/voices"
                  className="mt-4 block text-center text-sm font-semibold text-purple-600 hover:text-purple-700 sm:hidden"
                >
                  View all voices →
                </a>
              </>
            )}

            {selectedVoice && (
              <div className="mt-4 rounded-2xl border border-purple-100 bg-purple-50 p-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-purple-600">
                      Selected voice
                    </p>

                    <p className="mt-1 font-semibold text-gray-900">
                      {getDisplayVoiceName(selectedVoice.name)}
                    </p>
                  </div>

                  <span className="text-xs text-gray-500">
                    Voice
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* PRICING */}

          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">
                  Choose your plan
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  One successful payment gives you
                  one audio generation.
                </p>
              </div>

              {characterCount > 0 &&
                characterCount <=
                  MAX_CHARS &&
                recommendedPlan && (
                  <button
                    type="button"
                    onClick={() =>
                      selectPlan(
                        recommendedPlan
                      )
                    }
                    className="hidden text-sm font-semibold text-purple-600 hover:text-purple-700 sm:block"
                  >
                    Select recommended
                  </button>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {plans.map((plan) => {
                const selected =
                  selectedPlan.id ===
                  plan.id;

                const cannotFit =
                  characterCount >
                  plan.max_characters;

                const effectivePrice =
                  getEffectivePrice(
                    plan
                  );

                const hasOffer =
                  effectivePrice <
                  Number(plan.price);

                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() =>
                      selectPlan(plan)
                    }
                    className={`rounded-2xl border p-4 text-left transition ${
                      selected
                        ? "border-purple-600 bg-purple-50 ring-2 ring-purple-200"
                        : "border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-gray-900">
                        {plan.name}
                      </span>

                      {selected && (
                        <span className="rounded-full bg-purple-600 px-2 py-0.5 text-xs font-semibold text-white">
                          Selected
                        </span>
                      )}
                    </div>

                    <div className="mt-3">
                      {hasOffer ? (
                        <>
                          <div className="text-2xl font-bold text-gray-900">
                            ₹
                            {effectivePrice}
                          </div>
                            {hasOffer && (
                      <p className="mt-1 text-xs font-semibold text-green-600">
                        Special offer
                      </p>
                    )}
                          <div className="text-sm text-gray-400 line-through">
                            ₹
                            {plan.price}
                          </div>
                        </>
                      ) : (
                        <div className="text-2xl font-bold text-gray-900">
                          ₹
                          {effectivePrice}
                        </div>
                      )}
                    </div>

                    <div className="mt-1 text-xs text-gray-500">
                      Up to{" "}
                      {plan.max_characters.toLocaleString()}{" "}
                      characters
                    </div>

                    {cannotFit && (
                      <div className="mt-2 text-xs font-medium text-red-600">
                        Text is too long
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SELECTED PLAN */}

          <div className="mb-6 rounded-2xl bg-gray-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Selected plan
                </p>

                <p className="font-semibold text-gray-900">
                  {selectedPlan.name}
                </p>

                <p className="text-sm text-gray-500">
                  {selectedPlan.max_characters.toLocaleString()}{" "}
                  characters maximum
                </p>
              </div>

              <div className="text-left sm:text-right">
                <p className="text-sm text-gray-500">
                  Total
                </p>

                <p className="text-2xl font-bold text-gray-900">
                  ₹
                  {getEffectivePrice(
                    selectedPlan
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* ERROR */}

          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <strong>Error:</strong>{" "}
              {error}
            </div>
          )}

          {/* SUCCESS */}

          {success && (
            <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
              {success}
            </div>
          )}

          {/* PAY & GENERATE */}

          <button
            type="button"
            onClick={startPayment}
            disabled={!canStartPayment}
            className="w-full rounded-2xl bg-purple-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-purple-200 transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {paymentLoading
              ? "Processing..."
              : loading
                ? "Generating..."
                : `Pay ₹${getEffectivePrice(
                    selectedPlan
                  )} & Generate Audio`}
          </button>

          {/* PAYMENT */}

          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
            <span aria-hidden="true">
              🔒
            </span>

            <span>
              Secure payment with Razorpay
            </span>
          </div>

          {/* DOWNLOAD */}

          {downloadUrl && (
            <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5">
              <div className="mb-3">
                <h3 className="font-semibold text-green-900">
                  Your audio is ready
                </h3>

                <p className="mt-1 text-sm text-green-700">
                  Your MP3 has been generated successfully.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  handleDownload
                }
                className="inline-flex w-full items-center justify-center rounded-xl bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-700 sm:w-auto"
              >
                Download MP3
              </button>
            </div>
          )}

          {/* INFO */}

          <div className="mt-6 grid gap-3 text-sm text-gray-600 sm:grid-cols-3">
            <div className="rounded-xl bg-gray-50 p-3 text-center">
              <div className="font-semibold text-gray-900">
                AI Voices
              </div>

              <div className="mt-1">
                Choose your preferred voice
              </div>
            </div>

            <div className="rounded-xl bg-gray-50 p-3 text-center">
              <div className="font-semibold text-gray-900">
                One payment
              </div>

              <div className="mt-1">
                One audio generation
              </div>
            </div>

            <div className="rounded-xl bg-gray-50 p-3 text-center">
              <div className="font-semibold text-gray-900">
                MP3 output
              </div>

              <div className="mt-1">
                Secure download
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}