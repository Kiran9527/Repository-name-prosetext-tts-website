import Link from 'next/link';
import type { ReactNode } from 'react';

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[radial-gradient(circle_at_top_left,_#ede9fe,_transparent_35%),linear-gradient(180deg,#fafafa,#f5f3ff)] px-4 py-12 sm:px-6">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl shadow-purple-100 lg:grid-cols-[1fr_1.05fr]">
        <div className="hidden bg-gray-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-xl font-bold">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600">V</span>
              Prose<span className="text-purple-400">Text</span>
            </Link>
            <div className="mt-20 max-w-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-300">AI voice studio</p>
              <h2 className="mt-4 text-4xl font-bold leading-tight">Create natural voiceovers in seconds.</h2>
              <p className="mt-5 text-base leading-7 text-gray-400">Sign in to manage your generations, orders, payments and audio files from one place.</p>
            </div>
          </div>
          <p className="text-xs text-gray-500">Secure account access powered by Supabase Auth.</p>
        </div>

        <section className="p-6 sm:p-10">
          <div className="mx-auto max-w-md">
            <div className="lg:hidden">
              <Link href="/" className="inline-flex items-center gap-2 text-xl font-bold text-gray-900">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white">V</span>
                Prose<span className="text-purple-600">Text</span>
              </Link>
            </div>
            <div className="mt-8 lg:mt-0">
              <h1 className="text-3xl font-bold tracking-tight text-gray-950">{title}</h1>
              <p className="mt-2 text-sm leading-6 text-gray-500">{subtitle}</p>
            </div>
            <div className="mt-8">{children}</div>
            {footer ? <div className="mt-7 text-center text-sm text-gray-500">{footer}</div> : null}
          </div>
        </section>
      </div>
    </main>
  );
}
