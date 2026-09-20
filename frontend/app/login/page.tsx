import Link from 'next/link';
import AuthShell from '@/components/auth/AuthShell';
import AuthForm from '@/components/auth/AuthForm';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;

  const next = params.next || '/';

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue to your ProseText workspace."
      footer={
        <span>
          New to ProseText?{' '}
          <Link
            href="/signup"
            className="font-semibold text-purple-600 hover:text-purple-700"
          >
            Create an account
          </Link>
        </span>
      }
    >
      <AuthForm next={next} />
    </AuthShell>
  );
}