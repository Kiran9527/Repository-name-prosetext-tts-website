'use client';

import { useState } from 'react';
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { signIn, getProfile } from '@/lib/supabase-auth';

export default function AdminLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      const session = await signIn(email.trim(), password);

      const profile = await getProfile(session.user.id);

      if (!profile) {
        throw new Error('Admin profile could not be found.');
      }

      if (profile.role !== 'admin') {
        throw new Error('Access denied. This account is not an administrator.');
      }

      window.location.href = '/admin';
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to sign in as administrator.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="flex items-center gap-3 rounded-xl border border-purple-100 bg-purple-50 px-4 py-3">
        <ShieldCheck size={20} className="text-purple-600" />

        <div>
          <p className="text-sm font-semibold text-purple-900">
            Administrator access
          </p>

          <p className="text-xs text-purple-700">
            Only authorized admin accounts can continue.
          </p>
        </div>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-gray-700">
          Admin email
        </span>

        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          autoComplete="username"
          required
          placeholder="admin@example.com"
          className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none transition focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-100"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-gray-700">
          Password
        </span>

        <div className="relative">
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            placeholder="Enter admin password"
            className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 pr-12 text-sm outline-none transition focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-100"
          />

          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-400 hover:text-gray-700"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff size={18} />
            ) : (
              <Eye size={18} />
            )}
          </button>
        </div>
      </label>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 text-sm font-semibold text-white shadow-lg shadow-purple-200 transition hover:bg-purple-700 disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="animate-spin" size={18} />
        ) : (
          <ShieldCheck size={18} />
        )}

        {loading ? 'Verifying admin access…' : 'Sign in as Admin'}
      </button>
    </form>
  );
}