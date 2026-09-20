"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import { requestPasswordReset } from "@/lib/supabase-auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      await requestPasswordReset(trimmedEmail);

      setMessage(
        "If an account exists for this email, a password reset link has been sent. Please check your inbox and spam folder."
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Unable to send reset email.";

      if (
        errorMessage.toLowerCase().includes("rate limit") ||
        errorMessage.toLowerCase().includes("email rate limit")
      ) {
        setError(
          "Too many reset emails have been requested recently. Please wait a while before trying again."
        );
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your email and we’ll send instructions to reset your password."
      footer={
        <Link
          href="/login"
          className="font-semibold text-purple-600 hover:text-purple-700"
        >
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-gray-700">
            Email address
          </span>

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            disabled={loading}
            placeholder="you@example.com"
            className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-100 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </label>

        {message ? (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 text-sm font-semibold text-white shadow-lg shadow-purple-200 hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : null}

          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </AuthShell>
  );
}