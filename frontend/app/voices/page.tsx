"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type Voice = {
  id: string;
  name: string;
  language_code: string;
  language_name: string;
  category: string;
  description: string;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";
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
export default function VoicesPage() {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [playingVoiceId, setPlayingVoiceId] =
    useState<string | null>(null);

  const audioRef =
    useRef<HTMLAudioElement | null>(null);

  /*
   * Load voices
   */
  useEffect(() => {
    async function loadVoices() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_URL}/voices?t=${Date.now()}`,
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.detail || "Unable to load voices."
          );
        }

        if (!Array.isArray(data?.voices)) {
          throw new Error(
            "Invalid voices response."
          );
        }

        setVoices(data.voices);
      } catch (err) {
        console.error(
          "Voice loading error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load voices."
        );
      } finally {
        setLoading(false);
      }
    }

    loadVoices();
  }, []);

  /*
   * Stop audio when leaving the page.
   */
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();

        if (
          audioRef.current.src.startsWith("blob:")
        ) {
          URL.revokeObjectURL(
            audioRef.current.src
          );
        }

        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
    };
  }, []);

  /*
   * Filter voices by:
   * - name
   * - language
   * - category
   * - description
   */
  const filteredVoices = useMemo(() => {
    const query = search.trim().toLowerCase();

    return voices.filter((voice) => {
      if (!query) {
        return true;
      }

      return (
        voice.name
          ?.toLowerCase()
          .includes(query) ||
        voice.language_name
          ?.toLowerCase()
          .includes(query) ||
        voice.language_code
          ?.toLowerCase()
          .includes(query) ||
        voice.category
          ?.toLowerCase()
          .includes(query) ||
        voice.description
          ?.toLowerCase()
          .includes(query)
      );
    });
  }, [voices, search]);

  /*
   * Voice preview
   *
   * Backend endpoint:
   * POST /preview
   *
   * Request:
   * {
   *   voice_id: "...",
   *   text: "..."
   * }
   *
   * The backend returns temporary MP3 audio.
   * Nothing is stored permanently.
   */
  async function handlePreview(voice: Voice) {
    /*
     * Stop currently playing audio.
     */
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;

      if (
        audioRef.current.src.startsWith("blob:")
      ) {
        URL.revokeObjectURL(
          audioRef.current.src
        );
      }

      audioRef.current = null;
    }

    /*
     * If clicking the currently playing voice,
     * simply stop it.
     */
    if (playingVoiceId === voice.id) {
      setPlayingVoiceId(null);
      return;
    }

    try {
      setError("");
      setPlayingVoiceId(voice.id);

      const response = await fetch(
        `${API_URL}/preview`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "audio/mpeg",
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

      const audioBlob =
        await response.blob();

      if (!audioBlob.size) {
        throw new Error(
          "Voice preview returned empty audio."
        );
      }

      const audioUrl =
        URL.createObjectURL(audioBlob);

      const audio =
        new Audio(audioUrl);

      audioRef.current = audio;

      /*
       * Audio finished.
       */
      audio.onended = () => {
        setPlayingVoiceId(null);

        URL.revokeObjectURL(audioUrl);

        if (
          audioRef.current === audio
        ) {
          audioRef.current = null;
        }
      };

      /*
       * Audio playback error.
       */
      audio.onerror = () => {
        console.error(
          "Voice preview playback failed:",
          voice.name
        );

        setPlayingVoiceId(null);

        URL.revokeObjectURL(audioUrl);

        if (
          audioRef.current === audio
        ) {
          audioRef.current = null;
        }

        setError(
          "Unable to play this voice preview."
        );
      };

      await audio.play();
    } catch (err) {
      console.error(
        "Voice preview error:",
        err
      );

      setPlayingVoiceId(null);

      if (audioRef.current) {
        audioRef.current.pause();

        if (
          audioRef.current.src.startsWith("blob:")
        ) {
          URL.revokeObjectURL(
            audioRef.current.src
          );
        }

        audioRef.current = null;
      }

      setError(
        err instanceof Error
          ? err.message
          : "Unable to generate voice preview."
      );
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 pt-16">

      {/* =========================
          HERO
      ========================== */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">

          <div className="mx-auto max-w-3xl text-center">

            {/* Icon */}
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
              <svg
                width="32"
                height="32"
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

            <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-purple-600">
              Voice Library
            </p>

            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              AI Voices for Your Content
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-gray-600">
              Explore our collection of natural-sounding
              AI voices. Preview each voice and choose
              the one that fits your content.
            </p>

          </div>
        </div>
      </section>

      {/* =========================
          VOICE LIBRARY
      ========================== */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Sample Preview Voices
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {loading
                ? "Loading voices..."
                : `${filteredVoices.length} voice${
                    filteredVoices.length === 1
                      ? ""
                      : "s"
                  } available`}
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-80">

            <svg
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M21 21L16.65 16.65"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />

              <circle
                cx="11"
                cy="11"
                r="7"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search voices..."
              className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            />

          </div>
        </div>

        {/* =========================
            LOADING
        ========================== */}
        {loading && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

            {Array.from({ length: 6 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6"
                >

                  <div className="flex items-center gap-4">

                    <div className="h-12 w-12 rounded-full bg-gray-200" />

                    <div className="flex-1">

                      <div className="h-4 w-32 rounded bg-gray-200" />

                      <div className="mt-2 h-3 w-20 rounded bg-gray-200" />

                    </div>
                  </div>

                  <div className="mt-5 h-10 rounded-xl bg-gray-200" />

                  <div className="mt-3 h-10 rounded-xl bg-gray-200" />

                </div>
              )
            )}

          </div>
        )}

        {/* =========================
            ERROR
        ========================== */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">

            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">

              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M12 9V13"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                <path
                  d="M12 17H12.01"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                <path
                  d="M10.29 3.86L1.82 18A2 2 0 003.54 21H20.46A2 2 0 0022.18 18L13.71 3.86A2 2 0 0010.29 3.86Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

            </div>

            <h3 className="text-lg font-semibold text-red-900">
              Unable to load voices
            </h3>

            <p className="mt-2 text-sm text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                window.location.reload()
              }
              className="mt-5 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Try Again
            </button>

          </div>
        )}

        {/* =========================
            EMPTY SEARCH
        ========================== */}
        {!loading &&
          !error &&
          filteredVoices.length === 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center">

              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-500">

                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <circle
                    cx="11"
                    cy="11"
                    r="7"
                    stroke="currentColor"
                    strokeWidth="2"
                  />

                  <path
                    d="M20 20L16 16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>

              </div>

              <h3 className="text-lg font-semibold text-gray-900">
                No voices found
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Try searching with a different voice
                name, language, or category.
              </p>

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="mt-5 text-sm font-semibold text-purple-600 hover:text-purple-700"
                >
                  Clear search
                </button>
              )}

            </div>
          )}

        {/* =========================
            VOICE CARDS
        ========================== */}
        {!loading &&
          !error &&
          filteredVoices.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

              {filteredVoices.map((voice) => {
                const isPlaying =
                  playingVoiceId === voice.id;

                return (
                  <article
                    key={voice.id}
                    className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-purple-200 hover:shadow-lg"
                  >

                    {/* Voice Header */}
                    <div className="flex items-start justify-between gap-4">

                      <div className="flex min-w-0 items-center gap-4">

                        {/* Avatar */}
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-100 text-lg font-bold text-purple-700">
                          {voice.name
                            ?.charAt(0)
                            .toUpperCase() ||
                            "V"}
                        </div>

                        <div className="min-w-0">

                          <h3 className="truncate text-base font-bold text-gray-900">
                            {getDisplayVoiceName(voice.name)}
                          </h3>

                        </div>

                      </div>

                      {/* Featured */}
                      {voice.is_featured && (
                        <span className="shrink-0 rounded-full bg-purple-100 px-2.5 py-1 text-xs font-semibold text-purple-700">
                          Featured
                        </span>
                      )}

                    </div>

                    {/* Tags */}
                    <div className="mt-5 flex flex-wrap gap-2">

                      {voice.language_code && (
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                          {voice.language_name ||
                            voice.language_code}
                        </span>
                      )}

                      {voice.category && (
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium capitalize text-gray-600">
                          {voice.category}
                        </span>
                      )}

                    </div>

                    {/* Description */}
                    <p className="mt-5 min-h-[48px] text-sm leading-6 text-gray-600">
                      {voice.description ||
                        "Natural-sounding AI voice for high-quality text-to-speech."}
                    </p>

                    {/* Preview Button */}
                    <button
                      type="button"
                      onClick={() =>
                        handlePreview(voice)
                      }
                      className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                        isPlaying
                          ? "border-purple-300 bg-purple-50 text-purple-700"
                          : "border-gray-200 bg-white text-gray-700 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700"
                      }`}
                    >

                      {isPlaying ? (
                        <>
                          {/* Pause icon */}
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-hidden="true"
                          >
                            <rect
                              x="6"
                              y="5"
                              width="4"
                              height="14"
                              rx="1"
                              fill="currentColor"
                            />

                            <rect
                              x="14"
                              y="5"
                              width="4"
                              height="14"
                              rx="1"
                              fill="currentColor"
                            />
                          </svg>

                          Stop Preview
                        </>
                      ) : (
                        <>
                          {/* Play icon */}
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-hidden="true"
                          >
                            <path
                              d="M8 5V19L19 12L8 5Z"
                              fill="currentColor"
                            />
                          </svg>

                          Preview Voice
                        </>
                      )}

                    </button>

                    {/* Use Voice */}
                    <Link
                      href={`/?voice=${encodeURIComponent(
                        voice.id
                      )}#generator`}
                      className="mt-3 flex w-full items-center justify-center rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700 hover:shadow-md"
                    >
                      Use This Voice
                    </Link>

                  </article>
                );
              })}

            </div>
          )}

      </section>

      {/* =========================
          CTA
      ========================== */}
      <section className="border-t border-gray-200 bg-white">

        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">

            <svg
              width="26"
              height="26"
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

          <h2 className="mt-5 text-3xl font-bold text-gray-900">
            Ready to create your audio?
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-gray-600">
            Choose your favorite voice and turn your
            text into natural-sounding speech.
          </p>

          <Link
            href="/#generator"
            className="mt-7 inline-flex items-center justify-center rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-purple-200 transition hover:bg-purple-700 hover:shadow-lg"
          >
            Start Creating
          </Link>

        </div>

      </section>

    </main>
  );
}