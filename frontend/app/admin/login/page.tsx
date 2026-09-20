import AuthShell from '@/components/auth/AuthShell';
import AdminLoginForm from '@/components/auth/AdminLoginForm';

export default function AdminLoginPage() {
  return (
    <AuthShell
      title="Admin Login"
      subtitle="Sign in to access the ProseText administration console."
      footer={
        <span>
          <a
            href="/"
            className="font-semibold text-purple-600 hover:text-purple-700"
          >
            Back to ProseText
          </a>
        </span>
      }
    >
      <AdminLoginForm />
    </AuthShell>
  );
}