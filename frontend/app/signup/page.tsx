'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import AuthShell from '@/components/auth/AuthShell';
import { signUp } from '@/lib/supabase-auth';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setMessage(''); setLoading(true);
    try {
      const data = await signUp(email.trim(), password, name.trim());
      if (data?.access_token) {
        window.location.href = '/dashboard';
      } else {
        setMessage('Account created. Check your email to confirm your account, then sign in.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create account.');
    } finally { setLoading(false); }
  }

  return (
    <AuthShell title="Create your account" subtitle="Save your generations and manage your ProseText activity." footer={<span>Already have an account? <Link href="/login" className="font-semibold text-purple-600 hover:text-purple-700">Sign in</Link></span>}>
      <form onSubmit={submit} className="space-y-5">
        <label className="block"><span className="mb-2 block text-sm font-semibold text-gray-700">Full name</span><input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your name" className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-100" /></label>
        <label className="block"><span className="mb-2 block text-sm font-semibold text-gray-700">Email address</span><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" required placeholder="you@example.com" className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-100" /></label>
        <label className="block"><span className="mb-2 block text-sm font-semibold text-gray-700">Password</span><input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="new-password" minLength={6} required placeholder="At least 6 characters" className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-100" /></label>
        {message ? <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div> : null}
        {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
        <button disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 text-sm font-semibold text-white shadow-lg shadow-purple-200 hover:bg-purple-700 disabled:opacity-60">{loading ? <Loader2 className="animate-spin" size={18} /> : null}{loading ? 'Creating account…' : 'Create account'}</button>
      </form>
    </AuthShell>
  );
}
