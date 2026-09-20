const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

function assertConfig() {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error('Supabase Auth is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.');
  }
}

async function authRequest(path: string, init: RequestInit = {}) {
  assertConfig();
  const response = await fetch(`${SUPABASE_URL}/auth/v1${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY!,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.msg || data?.error_description || data?.message || 'Authentication request failed.');
  }
  return data;
}

export type AuthSession = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  user: {
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
  };
};

const SESSION_KEY = 'ProseText.auth.session';

export function getSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession(session: AuthSession | null) {
  if (typeof window === 'undefined') return;
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event('ProseText-auth-change'));
}

export async function signIn(email: string, password: string) {
  const data = await authRequest('/token?grant_type=password', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setSession(data);
  return data as AuthSession;
}

export async function signUp(email: string, password: string, fullName: string) {
  return authRequest('/signup', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      data: { full_name: fullName },
    }),
  });
}

export async function requestPasswordReset(email: string) {
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/reset-password`
      : undefined;

  return authRequest("/recover", {
    method: "POST",
    body: JSON.stringify({
      email,
      ...(redirectTo ? { redirect_to: redirectTo } : {}),
    }),
  });
}

export async function updatePassword(
  password: string,
  accessToken: string
) {
  assertConfig();

  const response = await fetch(
    `${SUPABASE_URL}/auth/v1/user`,
    {
      method: "PUT",
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY!,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        password,
      }),
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data?.msg ||
        data?.error_description ||
        data?.message ||
        "Unable to update password."
    );
  }

  return data;
}

export async function refreshSession() {
  const current = getSession();
  if (!current?.refresh_token) return null;
  try {
    const data = await authRequest('/token?grant_type=refresh_token', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: current.refresh_token }),
    });
    setSession(data);
    return data as AuthSession;
  } catch {
    setSession(null);
    return null;
  }
}

export async function getCurrentUser() {
  const session = getSession();
  if (!session?.access_token) return null;
  assertConfig();
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY!,
      Authorization: `Bearer ${session.access_token}`,
    },
  });
  if (!response.ok) return null;
  return response.json();
}

export async function getProfile(userId: string) {
  const session = getSession();

  if (!session?.access_token) {
    console.error("getProfile: No active session");
    return null;
  }

  assertConfig();

  const url = new URL(`${SUPABASE_URL}/rest/v1/profiles`);

  url.searchParams.set(
    "select",
    "id,full_name,role,is_active,created_at"
  );

  url.searchParams.set("id", `eq.${userId}`);

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY!,
        Authorization: `Bearer ${session.access_token}`,
        Accept: "application/json",
      },
    });

    const responseText = await response.text();

    console.log("getProfile status:", response.status);
    console.log("getProfile response:", responseText);
    console.log("getProfile userId:", userId);

    if (!response.ok) {
      console.error(
        "getProfile failed:",
        response.status,
        responseText
      );
      return null;
    }

    const rows = responseText
      ? JSON.parse(responseText)
      : [];

    return rows?.[0] ?? null;
  } catch (error) {
    console.error("getProfile exception:", error);
    return null;
  }
}

export function signOut() {
  setSession(null);
}
