'use client';

import { useEffect, useState } from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CreditCard,
  DollarSign,
  FileAudio,
  Search,
  Settings2,
  Users,
  Volume2,
} from 'lucide-react';

import ProtectedShell from '@/components/auth/ProtectedShell';
import { getSession } from '@/lib/supabase-auth';

const tabs = [
  'overview',
  'users',
  'orders',
  'payments',
  'pricing',
  'voices',
];

type RecentOrder = {
  id: string;
  user_id: string | null;
  amount: number;
  character_count: number;
  payment_status: string;
  audio_status: string;
  created_at: string;
};
type AdminOrder = {
  id: string;
  user_id: string | null;
  user_name: string;
  user_email: string | null;
  voice_id: string | null;
  pricing_id: string | null;
  plan_name: string;
  amount: number;
  currency: string;
  character_count: number;
  payment_status: string;
  audio_status: string;
  download_status: string;
  refund_status: string;
  generation_attempts: number;
  created_at: string | null;
  updated_at: string | null;
};

type AdminPayment = {
  id: string;
  order_id: string;
  user_id: string;
  user_name: string;
  user_email: string | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  character_count: number;
  created_at: string | null;
  updated_at: string | null;
};

type AdminPricing = {
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

type DashboardUser = {
  id: string;
  email: string | null;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string | null;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
};
type AdminVoice = {
  id: string;
  name: string;
  provider: string;
  provider_voice_id: string;
  language_code: string;
  language_name: string;
  category: string;
  description: string;
  sample_file_path: string | null;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
};

type DashboardStats = {
  success: boolean;

  users: {
    total: number;
  };

  orders: {
    total: number;
    captured: number;
    recent: RecentOrder[];
  };

  revenue: {
    total: number;
    currency: string;
  };

  tts: {
    characters: number;
  };

  audio: {
    generated: number;
    failed: number;
    expired: number;
  };
};

function formatDate(value: string | null) {
  if (!value) {
    return '—';
  }

  try {
    return new Date(value).toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function shortId(id: string) {
  if (!id) return '—';

  if (id.length <= 12) {
    return id;
  }

  return `${id.slice(0, 8)}...${id.slice(-4)}`;
}

function formatAmount(amount: number, currency = 'INR') {
  if (currency === 'INR') {
    return `₹${Number(amount || 0).toFixed(2)}`;
  }

  return `${currency} ${Number(amount || 0).toFixed(2)}`;
}
function toDateTimeLocal(value: string | null) {
  if (!value) return '';

  try {
    const date = new Date(value);

    const pad = (number: number) =>
      String(number).padStart(2, '0');

    return (
      `${date.getFullYear()}-${pad(
        date.getMonth() + 1
      )}-${pad(date.getDate())}T` +
      `${pad(date.getHours())}:${pad(
        date.getMinutes()
      )}`
    );
  } catch {
    return '';
  }
}
export default function AdminPage() {
  const [tab, setTab] = useState('overview');

  const [stats, setStats] =
    useState<DashboardStats | null>(null);

  const [users, setUsers] =
    useState<DashboardUser[]>([]);


  const [editingPlan, setEditingPlan] =
    useState<AdminPricing | null>(null);

  const [savingPricing, setSavingPricing] =
    useState(false);

  const [pricingSuccess, setPricingSuccess] =
    useState('');
  
  const [orders, setOrders] =
  useState<AdminOrder[]>([]);

  const [payments, setPayments] =
  useState<AdminPayment[]>([]);

  const [pricing, setPricing] =
  useState<AdminPricing[]>([]);

  const [voices, setVoices] =
  useState<AdminVoice[]>([]);

  const [loadingVoices, setLoadingVoices] =
    useState(false);

  const [voicesError, setVoicesError] =
    useState('');

  const [syncingVoices, setSyncingVoices] =
    useState(false);

  const [voicesSuccess, setVoicesSuccess] =
    useState('');

  const [loadingPricing, setLoadingPricing] =
    useState(false);

  const [pricingError, setPricingError] =
    useState('');

  const [loadingPayments, setLoadingPayments] =
    useState(false);

  const [paymentsError, setPaymentsError] =
    useState('');

  const [paymentSearch, setPaymentSearch] =
    useState('');

const [loadingOrders, setLoadingOrders] =
  useState(false);

const [ordersError, setOrdersError] =
  useState('');

const [orderSearch, setOrderSearch] =
  useState('');

  const [loadingStats, setLoadingStats] =
    useState(true);

  const [loadingUsers, setLoadingUsers] =
    useState(false);

  const [statsError, setStatsError] =
    useState('');

  const [usersError, setUsersError] =
    useState('');

  const [userSearch, setUserSearch] =
    useState('');

  // ============================================================
  // LOAD DASHBOARD STATS
  // ============================================================

  useEffect(() => {
    async function loadStats() {
      try {
        setLoadingStats(true);
        setStatsError('');

        const session = getSession();

        if (!session?.access_token) {
          throw new Error(
            'Admin session not found.'
          );
        }

        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL ||
          'http://127.0.0.1:8000';

        const response = await fetch(
          `${apiUrl}/admin/dashboard/stats`,
          {
            method: 'GET',
            headers: {
              Authorization:
                `Bearer ${session.access_token}`,
              Accept: 'application/json',
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.detail ||
              'Unable to load dashboard statistics.'
          );
        }

        setStats(data);
      } catch (error: any) {
        console.error(
          'Dashboard stats error:',
          error
        );

        setStatsError(
          error?.message ||
            'Unable to load dashboard statistics.'
        );
      } finally {
        setLoadingStats(false);
      }
    }

    loadStats();
  }, []);

  // ============================================================
  // LOAD USERS
  // ============================================================

  useEffect(() => {
    if (tab !== 'users') {
      return;
    }

    async function loadUsers() {
      try {
        setLoadingUsers(true);
        setUsersError('');

        const session = getSession();

        if (!session?.access_token) {
          throw new Error(
            'Admin session not found.'
          );
        }

        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL ||
          'http://127.0.0.1:8000';

        const response = await fetch(
          `${apiUrl}/admin/users`,
          {
            method: 'GET',
            headers: {
              Authorization:
                `Bearer ${session.access_token}`,
              Accept: 'application/json',
            },
          }
        );

        const data = await response.json();

        console.log(
          'Admin users response:',
          data
        );

        if (!response.ok) {
          throw new Error(
            data?.detail ||
              'Unable to load users.'
          );
        }

        setUsers(
          Array.isArray(data?.users)
            ? data.users
            : []
        );
      } catch (error: any) {
        console.error(
          'Admin users error:',
          error
        );

        setUsersError(
          error?.message ||
            'Unable to load users.'
        );
      } finally {
        setLoadingUsers(false);
      }
    }

    loadUsers();
  }, [tab]);

// ============================================================
// LOAD ORDERS
// ============================================================

  useEffect(() => {
    if (tab !== 'orders') {
      return;
    }

    async function loadOrders() {
      try {
        setLoadingOrders(true);
        setOrdersError('');

        const session = getSession();

        if (!session?.access_token) {
          throw new Error(
            'Admin session not found.'
          );
        }

        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL ||
          'http://127.0.0.1:8000';

        const response = await fetch(
          `${apiUrl}/admin/orders`,
          {
            method: 'GET',
            headers: {
              Authorization:
                `Bearer ${session.access_token}`,
              Accept: 'application/json',
            },
          }
        );

        const data = await response.json();

        console.log(
          'Admin orders response:',
          data
        );

        if (!response.ok) {
          throw new Error(
            data?.detail ||
              'Unable to load orders.'
          );
        }

        setOrders(
          Array.isArray(data?.orders)
            ? data.orders
            : []
        );

      } catch (error: any) {
        console.error(
          'Admin orders error:',
          error
        );

        setOrdersError(
          error?.message ||
            'Unable to load orders.'
        );

      } finally {
        setLoadingOrders(false);
      }
    }

    loadOrders();
  }, [tab]);

  // ============================================================
// LOAD PAYMENTS
// ============================================================

useEffect(() => {
  if (tab !== 'payments') {
    return;
  }

  async function loadPayments() {
    try {
      setLoadingPayments(true);
      setPaymentsError('');

      const session = getSession();

      if (!session?.access_token) {
        throw new Error(
          'Admin session not found.'
        );
      }

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        'http://127.0.0.1:8000';

      const response = await fetch(
        `${apiUrl}/admin/payments`,
        {
          method: 'GET',
          headers: {
            Authorization:
              `Bearer ${session.access_token}`,
            Accept: 'application/json',
          },
        }
      );

      const data = await response.json();

      console.log(
        'Admin payments response:',
        data
      );

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            'Unable to load payments.'
        );
      }

      setPayments(
        Array.isArray(data?.payments)
          ? data.payments
          : []
      );

    } catch (error: any) {
      console.error(
        'Admin payments error:',
        error
      );

      setPaymentsError(
        error?.message ||
          'Unable to load payments.'
      );

    } finally {
      setLoadingPayments(false);
    }
  }

  loadPayments();
}, [tab]);

// ============================================================
// LOAD PRICING
// ============================================================

useEffect(() => {
  if (tab !== 'pricing') {
    return;
  }

  async function loadPricing() {
    try {
      setLoadingPricing(true);
      setPricingError('');

      const session = getSession();

      if (!session?.access_token) {
        throw new Error(
          'Admin session not found.'
        );
      }

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        'http://127.0.0.1:8000';

      const response = await fetch(
        `${apiUrl}/admin/pricing?t=${Date.now()}`,
        {
          method: 'GET',
          cache: 'no-store',
          headers: {
            Authorization:
              `Bearer ${session.access_token}`,
            Accept: 'application/json',
          },
        }
      );

      const data = await response.json();

      console.log(
        'Admin pricing response:',
        data
      );

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            'Unable to load pricing.'
        );
      }

      setPricing(
        Array.isArray(data?.plans)
          ? data.plans
          : []
      );

    } catch (error: any) {
      console.error(
        'Admin pricing error:',
        error
      );

      setPricingError(
        error?.message ||
          'Unable to load pricing.'
      );

    } finally {
      setLoadingPricing(false);
    }
  }

  loadPricing();
}, [tab]);

  // ============================================================
  // LOAD VOICES
  // ============================================================

  useEffect(() => {
    if (tab !== 'voices') {
      return;
    }

    async function loadVoices() {
      try {
        setLoadingVoices(true);
        setVoicesError('');

        const session = getSession();

        if (!session?.access_token) {
          throw new Error('Admin session not found.');
        }

        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL ||
          'http://127.0.0.1:8000';

        const response = await fetch(
          `${apiUrl}/admin/voices`,
          {
            method: 'GET',
            cache: 'no-store',
            headers: {
              Authorization:
                `Bearer ${session.access_token}`,
              Accept: 'application/json',
            },
          }
        );

        const data = await response.json();

        console.log(
          'Admin voices response:',
          data
        );

        if (!response.ok) {
          throw new Error(
            data?.detail ||
              'Unable to load voices.'
          );
        }

        setVoices(
          Array.isArray(data?.voices)
            ? data.voices
            : []
        );
      } catch (error: any) {
        console.error(
          'Admin voices error:',
          error
        );

        setVoicesError(
          error?.message ||
            'Unable to load voices.'
        );
      } finally {
        setLoadingVoices(false);
      }
    }

    loadVoices();
  }, [tab]);

  // ============================================================
// FILTER PAYMENTS
// ============================================================

const filteredPayments = payments.filter(
  (payment) => {
    const search =
      paymentSearch.trim().toLowerCase();

    if (!search) {
      return true;
    }

    return (
      payment.id
        ?.toLowerCase()
        .includes(search) ||

      payment.order_id
        ?.toLowerCase()
        .includes(search) ||

      payment.user_name
        ?.toLowerCase()
        .includes(search) ||

      payment.user_email
        ?.toLowerCase()
        .includes(search) ||

      payment.razorpay_order_id
        ?.toLowerCase()
        .includes(search) ||

      payment.razorpay_payment_id
        ?.toLowerCase()
        .includes(search) ||

      payment.status
        ?.toLowerCase()
        .includes(search) ||

      payment.payment_method
        ?.toLowerCase()
        .includes(search)
    );
  }
);

  // ============================================================
  // FILTER USERS
  // ============================================================

  const filteredUsers = users.filter(
    (user) => {
      const search =
        userSearch.trim().toLowerCase();

      if (!search) {
        return true;
      }

      return (
        user.email
          ?.toLowerCase()
          .includes(search) ||
        user.full_name
          ?.toLowerCase()
          .includes(search) ||
        user.id
          ?.toLowerCase()
          .includes(search) ||
        user.role
          ?.toLowerCase()
          .includes(search)
      );
    }
  );
  // ============================================================
// FILTER ORDERS
// ============================================================

const filteredOrders = orders.filter(
  (order) => {
    const search =
      orderSearch.trim().toLowerCase();

    if (!search) {
      return true;
    }

    return (
      order.id
        ?.toLowerCase()
        .includes(search) ||

      order.user_name
        ?.toLowerCase()
        .includes(search) ||

      order.user_email
        ?.toLowerCase()
        .includes(search) ||

      order.plan_name
        ?.toLowerCase()
        .includes(search) ||

      order.payment_status
        ?.toLowerCase()
        .includes(search) ||

      order.audio_status
        ?.toLowerCase()
        .includes(search)
    );
  }
);

  // ============================================================
  // DASHBOARD CARDS
  // ============================================================

  const dashboardCards = [
    {
      title: 'Total users',
      value: loadingStats
        ? '...'
        : stats?.users?.total ?? 0,
      subtitle: loadingStats
        ? 'Loading...'
        : `${stats?.users?.total ?? 0} registered users`,
      icon: Users,
    },

    {
      title: 'Total orders',
      value: loadingStats
        ? '...'
        : stats?.orders?.total ?? 0,
      subtitle: loadingStats
        ? 'Loading...'
        : `${stats?.orders?.captured ?? 0} captured`,
      icon: CreditCard,
    },

    {
      title: 'Revenue',
      value: loadingStats
        ? '...'
        : formatAmount(
            stats?.revenue?.total ?? 0,
            stats?.revenue?.currency || 'INR'
          ),
      subtitle: loadingStats
        ? 'Loading...'
        : `${stats?.orders?.captured ?? 0} captured payments`,
      icon: DollarSign,
    },

    {
      title: 'TTS characters',
      value: loadingStats
        ? '...'
        : (
            stats?.tts?.characters ?? 0
          ).toLocaleString('en-IN'),
      subtitle: loadingStats
        ? 'Loading...'
        : `${(
            stats?.tts?.characters ?? 0
          ).toLocaleString('en-IN')} characters processed`,
      icon: Volume2,
    },
  ];
  async function savePricing(plan: AdminPricing) {
  try {
    setSavingPricing(true);
    setPricingError('');
    setPricingSuccess('');

    // -----------------------------
    // VALIDATION
    // -----------------------------

    if (!plan.name.trim()) {
      throw new Error('Plan name is required.');
    }

    if (plan.price < 0) {
      throw new Error('Price cannot be negative.');
    }

    if (plan.included_characters <= 0) {
      throw new Error(
        'Included characters must be greater than zero.'
      );
    }

    if (plan.max_characters <= 0) {
      throw new Error(
        'Maximum characters must be greater than zero.'
      );
    }

    if (plan.max_characters < plan.included_characters) {
      throw new Error(
        'Maximum characters cannot be less than included characters.'
      );
    }

    if (
      plan.offer_price !== null &&
      plan.offer_price > plan.price
    ) {
      throw new Error(
        'Offer price cannot be greater than regular price.'
      );
    }

    // -----------------------------
    // ADMIN SESSION
    // -----------------------------

    const session = getSession();

    if (!session?.access_token) {
      throw new Error('Admin session not found.');
    }

    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      'http://127.0.0.1:8000';

    // -----------------------------
    // UPDATE DATABASE
    // -----------------------------

    const response = await fetch(
      `${apiUrl}/admin/pricing/${plan.id}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name: plan.name.trim(),
          price: Number(plan.price),
          included_characters: Number(
            plan.included_characters
          ),
          max_characters: Number(
            plan.max_characters
          ),
          is_active: Boolean(plan.is_active),
          offer_price:
            plan.offer_price === null
              ? null
              : Number(plan.offer_price),
          offer_start: plan.offer_start || null,
          offer_end: plan.offer_end || null,
        }),
      }
    );

    const data = await response.json();

    console.log(
      'Update pricing response:',
      data
    );

    if (!response.ok) {
      throw new Error(
        data?.detail ||
          'Unable to update pricing.'
      );
    }
        // -----------------------------
    // APPLY UPDATED PLAN IMMEDIATELY
    // -----------------------------

    if (data?.plan) {
      setPricing((current) =>
        current.map((item) =>
          item.id === plan.id
            ? {
                ...item,
                ...data.plan,
                price: Number(data.plan.price ?? plan.price),
                included_characters: Number(
                  data.plan.included_characters ??
                    plan.included_characters
                ),
                max_characters: Number(
                  data.plan.max_characters ??
                    plan.max_characters
                ),
                offer_price:
                  data.plan.offer_price !== undefined
                    ? data.plan.offer_price === null
                      ? null
                      : Number(data.plan.offer_price)
                    : plan.offer_price,
                is_active: Boolean(
                  data.plan.is_active ?? plan.is_active
                ),
              }
            : item
        )
      );
    }

    // -----------------------------
    // RELOAD PRICING FROM DATABASE
    // -----------------------------

    const refreshResponse = await fetch(
      `${apiUrl}/admin/pricing?t=${Date.now()}`,
      {
        method: 'GET',
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          Accept: 'application/json',
        },
      }
    );

    const refreshData =
      await refreshResponse.json();

    console.log(
      'Fresh pricing response:',
      refreshData
    );

    if (!refreshResponse.ok) {
      throw new Error(
        refreshData?.detail ||
          'Pricing was updated, but the latest pricing could not be loaded.'
      );
    }

    if (Array.isArray(refreshData?.plans)) {
      setPricing(refreshData.plans);
    }

    // -----------------------------
    // CLOSE MODAL
    // -----------------------------

    setEditingPlan(null);

    setPricingSuccess(
      `${plan.name} pricing updated successfully.`
    );

    setTimeout(() => {
      setPricingSuccess('');
    }, 4000);
    // -----------------------------
    // RELOAD PRICING FROM DATABASE
    // -----------------------------
    
    // const refreshResponse = await fetch(
    //   `${apiUrl}/admin/pricing?t=${Date.now()}`,
    //   {
    //     method: 'GET',
    //     cache: 'no-store',
    //     headers: {
    //       Authorization: `Bearer ${session.access_token}`,
    //       Accept: 'application/json',
    //     },
    //   }
    // );

    // const refreshData =
    //   await refreshResponse.json();

    // console.log(
    //   'Refreshed pricing response:',
    //   refreshData
    // );

    // if (!refreshResponse.ok) {
    //   throw new Error(
    //     refreshData?.detail ||
    //       'Pricing was updated, but the latest pricing could not be loaded.'
    //   );
    // }

    // setPricing(
    //   Array.isArray(refreshData?.plans)
    //     ? refreshData.plans
    //     : []
    // );

    // -----------------------------
    // CLOSE MODAL
    // -----------------------------

    setEditingPlan(null);

    setPricingSuccess(
      `${plan.name} pricing updated successfully.`
    );

    setTimeout(() => {
      setPricingSuccess('');
    }, 4000);

  } catch (error: any) {
    console.error(
      'Save pricing error:',
      error
    );

    setPricingError(
      error?.message ||
        'Unable to update pricing.'
    );

  } finally {
    setSavingPricing(false);
  }
}
  return (
    <ProtectedShell admin>
      <div className="min-h-screen bg-white">

        {/* ======================================================
            TOP ADMIN HEADER
        ====================================================== */}

        <div className="border-b border-gray-200 px-8 py-5">
          <div className="flex items-center justify-between">

            <div>
              <div className="text-sm font-medium text-purple-600">
                Admin Console
              </div>

              <h1 className="mt-1 text-xl font-semibold text-gray-900">
                ProseText Administration
              </h1>
            </div>

            <div className="flex items-center gap-3">

              <div className="flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700">
                <Activity
                  size={16}
                />

                System online
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 font-semibold text-purple-700">
                K
              </div>

            </div>
          </div>
        </div>

        {/* ======================================================
            MAIN CONTENT
        ====================================================== */}

        <main className="px-8 py-8">

          <div className="mx-auto max-w-7xl">

            <div className="mb-8">

              <div className="text-sm font-semibold text-purple-600">
                Administration
              </div>

              <h2 className="mt-2 text-4xl font-bold tracking-tight text-gray-950">
                Admin dashboard
              </h2>

              <p className="mt-2 text-base text-gray-500">
                Manage ProseText users, orders,
                payments, pricing and system activity.
              </p>

            </div>

            {/* ==================================================
                TABS
            ================================================== */}

            <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">

              <div className="flex items-center gap-1">

                {tabs.map((item) => (

                  <button
                    key={item}
                    onClick={() =>
                      setTab(item)
                    }
                    className={`rounded-xl px-7 py-4 text-sm font-medium capitalize transition ${
                      tab === item
                        ? 'bg-black text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {item}
                  </button>

                ))}

              </div>

            </div>

            {/* ==================================================
                OVERVIEW
            ================================================== */}

            {tab === 'overview' && (

              <div>

                {statsError && (
                  <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                    {statsError}
                  </div>
                )}

                {/* CARDS */}

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">

                  {dashboardCards.map(
                    (card) => {

                      const Icon =
                        card.icon;

                      return (
                        <div
                          key={card.title}
                          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                        >

                          <div className="mb-6 flex items-center justify-between">

                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                              <Icon
                                size={23}
                              />
                            </div>

                            <ArrowUpRight
                              size={18}
                              className="text-gray-300"
                            />

                          </div>

                          <div className="text-sm text-gray-500">
                            {card.title}
                          </div>

                          <div className="mt-2 text-3xl font-bold text-gray-950">
                            {card.value}
                          </div>

                          <div className="mt-3 text-sm text-gray-400">
                            {card.subtitle}
                          </div>

                        </div>
                      );
                    }
                  )}

                </div>

                {/* RECENT ORDERS */}

                <div className="mt-7 rounded-2xl border border-gray-200 bg-white shadow-sm">

                  <div className="border-b border-gray-100 px-6 py-5">

                    <h3 className="text-lg font-semibold text-gray-900">
                      Recent orders
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      Latest customer activity
                    </p>

                  </div>

                  <div className="overflow-x-auto">

                    <table className="w-full text-left">

                      <thead className="border-b border-gray-100 bg-gray-50">

                        <tr>

                          <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Order
                          </th>

                          <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Amount
                          </th>

                          <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Characters
                          </th>

                          <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Payment
                          </th>

                          <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Audio
                          </th>

                          <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Created
                          </th>

                        </tr>

                      </thead>

                      <tbody className="divide-y divide-gray-100">

                        {(stats?.orders?.recent || []).map(
                          (order) => (

                            <tr
                              key={order.id}
                              className="hover:bg-gray-50"
                            >

                              <td className="px-6 py-4 font-mono text-sm text-gray-700">
                                #{shortId(order.id)}
                              </td>

                              <td className="px-6 py-4 font-semibold text-gray-900">
                                ₹
                                {Number(
                                  order.amount || 0
                                ).toFixed(2)}
                              </td>

                              <td className="px-6 py-4 text-sm text-gray-600">
                                {Number(
                                  order.character_count || 0
                                ).toLocaleString(
                                  'en-IN'
                                )}
                              </td>

                              <td className="px-6 py-4">

                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                    order.payment_status ===
                                    'captured'
                                      ? 'bg-green-50 text-green-700'
                                      : 'bg-yellow-50 text-yellow-700'
                                  }`}
                                >
                                  {order.payment_status}
                                </span>

                              </td>

                              <td className="px-6 py-4">

                                <span className="text-sm text-gray-600">
                                  {order.audio_status}
                                </span>

                              </td>

                              <td className="px-6 py-4 text-sm text-gray-500">
                                {formatDate(
                                  order.created_at
                                )}
                              </td>

                            </tr>

                          )
                        )}

                        {(!stats?.orders?.recent ||
                          stats.orders.recent.length === 0) && (

                          <tr>

                            <td
                              colSpan={6}
                              className="px-6 py-12 text-center text-sm text-gray-500"
                            >
                              No orders found.
                            </td>

                          </tr>

                        )}

                      </tbody>

                    </table>

                  </div>

                </div>

              </div>
            )}

            {/* ==================================================
                USERS
            ================================================== */}

            {tab === 'users' && (

              <div>

                <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">

                  {/* USERS HEADER */}

                  <div className="border-b border-gray-100 px-6 py-5">

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                      <div>

                        <h3 className="text-xl font-semibold text-gray-900">
                          Users
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                          Manage registered ProseText users
                        </p>

                      </div>

                      <div className="flex items-center gap-3">

                        <div className="rounded-lg bg-gray-50 px-4 py-2 text-sm text-gray-600">
                          <span className="font-semibold text-gray-900">
                            {users.length}
                          </span>{' '}
                          users
                        </div>

                      </div>

                    </div>

                  </div>

                  {/* SEARCH */}

                  <div className="border-b border-gray-100 px-6 py-4">

                    <div className="relative max-w-md">

                      <Search
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />

                      <input
                        type="text"
                        value={userSearch}
                        onChange={(event) =>
                          setUserSearch(
                            event.target.value
                          )
                        }
                        placeholder="Search by name, email, ID or role..."
                        className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                      />

                    </div>

                  </div>

                  {/* ERROR */}

                  {usersError && (

                    <div className="mx-6 mt-5 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                      {usersError}
                    </div>

                  )}

                  {/* LOADING */}

                  {loadingUsers && (

                    <div className="flex items-center justify-center px-6 py-16">

                      <div className="text-sm text-gray-500">
                        Loading users...
                      </div>

                    </div>

                  )}

                  {/* USERS TABLE */}

                  {!loadingUsers && !usersError && (

                    <div className="overflow-x-auto">

                      <table className="w-full min-w-[1000px] text-left">

                        <thead className="border-b border-gray-100 bg-gray-50">

                          <tr>

                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Name
                            </th>

                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Email
                            </th>

                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                              User ID
                            </th>

                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Role
                            </th>

                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Status
                            </th>

                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Email
                            </th>

                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Last sign in
                            </th>

                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Created
                            </th>

                          </tr>

                        </thead>

                        <tbody className="divide-y divide-gray-100">

                          {filteredUsers.map(
                            (user) => (

                              <tr
                                key={user.id}
                                className="hover:bg-gray-50"
                              >

                                {/* NAME */}

                                <td className="px-6 py-5">

                                  <div className="flex items-center gap-3">

                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 font-semibold text-purple-700">
                                      {(
                                        user.full_name ||
                                        user.email ||
                                        'U'
                                      )
                                        .charAt(0)
                                        .toUpperCase()}
                                    </div>

                                    <div>

                                      <div className="font-semibold text-gray-900">
                                        {user.full_name ||
                                          '—'}
                                      </div>

                                      <div className="text-xs text-gray-400">
                                        Registered user
                                      </div>

                                    </div>

                                  </div>

                                </td>

                                {/* EMAIL */}

                                <td className="px-6 py-5">

                                  <div className="text-sm text-gray-700">
                                    {user.email ||
                                      '—'}
                                  </div>

                                </td>

                                {/* USER ID */}

                                <td className="px-6 py-5">

                                  <div
                                    title={user.id}
                                    className="font-mono text-xs text-gray-500"
                                  >
                                    {shortId(
                                      user.id
                                    )}
                                  </div>

                                </td>

                                {/* ROLE */}

                                <td className="px-6 py-5">

                                  <span
                                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                      user.role ===
                                      'admin'
                                        ? 'bg-purple-50 text-purple-700'
                                        : 'bg-gray-100 text-gray-700'
                                    }`}
                                  >
                                    {user.role}
                                  </span>

                                </td>

                                {/* STATUS */}

                                <td className="px-6 py-5">

                                  <span
                                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                                      user.is_active
                                        ? 'bg-green-50 text-green-700'
                                        : 'bg-red-50 text-red-700'
                                    }`}
                                  >

                                    <span
                                      className={`h-2 w-2 rounded-full ${
                                        user.is_active
                                          ? 'bg-green-500'
                                          : 'bg-red-500'
                                      }`}
                                    />

                                    {user.is_active
                                      ? 'Active'
                                      : 'Inactive'}

                                  </span>

                                </td>

                                {/* EMAIL CONFIRMATION */}

                                <td className="px-6 py-5">

                                  {user.email_confirmed_at ? (

                                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                                      Confirmed
                                    </span>

                                  ) : (

                                    <span className="rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700">
                                      Pending
                                    </span>

                                  )}

                                </td>

                                {/* LAST LOGIN */}

                                <td className="px-6 py-5 text-sm text-gray-500">
                                  {formatDate(
                                    user.last_sign_in_at
                                  )}
                                </td>

                                {/* CREATED */}

                                <td className="px-6 py-5 text-sm text-gray-500">
                                  {formatDate(
                                    user.created_at
                                  )}
                                </td>

                              </tr>

                            )
                          )}

                          {filteredUsers.length === 0 && (

                            <tr>

                              <td
                                colSpan={8}
                                className="px-6 py-16 text-center"
                              >

                                <Users
                                  size={32}
                                  className="mx-auto text-gray-300"
                                />

                                <div className="mt-3 text-sm font-medium text-gray-700">
                                  {userSearch
                                    ? 'No matching users found.'
                                    : 'No users found.'}
                                </div>

                                <div className="mt-1 text-sm text-gray-400">
                                  {userSearch
                                    ? 'Try another search.'
                                    : 'Registered users will appear here.'}
                                </div>

                              </td>

                            </tr>

                          )}

                        </tbody>

                      </table>

                    </div>

                  )}

                </div>

              </div>
            )}

            {/* ==================================================
                ORDERS
            ================================================== */}

            {/* ==================================================
    ORDERS
================================================== */}

{tab === 'orders' && (

  <div>

    {/* ORDERS CARD */}

    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">

      {/* HEADER */}

      <div className="border-b border-gray-100 px-6 py-5">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <h3 className="text-xl font-semibold text-gray-900">
              Orders
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Manage ProseText customer orders
            </p>

          </div>

          <div className="rounded-lg bg-gray-50 px-4 py-2 text-sm text-gray-600">

            <span className="font-semibold text-gray-900">
              {orders.length}
            </span>{' '}

            orders

          </div>

        </div>

      </div>


      {/* SEARCH */}

      <div className="border-b border-gray-100 px-6 py-4">

        <div className="relative max-w-md">

          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            value={orderSearch}
            onChange={(event) =>
              setOrderSearch(
                event.target.value
              )
            }
            placeholder="Search by order ID, name, email, plan..."
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
          />

        </div>

      </div>


      {/* ERROR */}

      {ordersError && (

        <div className="mx-6 mt-5 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {ordersError}
        </div>

      )}


      {/* LOADING */}

      {loadingOrders && (

        <div className="flex items-center justify-center px-6 py-16">

          <div className="text-sm text-gray-500">
            Loading orders...
          </div>

        </div>

      )}


      {/* TABLE */}

      {!loadingOrders && !ordersError && (

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1250px] text-left">

            <thead className="border-b border-gray-100 bg-gray-50">

              <tr>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Order
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Customer
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Plan
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Amount
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Characters
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Payment
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Audio
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Refund
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Created
                </th>

              </tr>

            </thead>


            <tbody className="divide-y divide-gray-100">

              {filteredOrders.map(
                (order) => (

                  <tr
                    key={order.id}
                    className="hover:bg-gray-50"
                  >

                    {/* ORDER */}

                    <td className="px-6 py-5">

                      <div
                        title={order.id}
                        className="font-mono text-xs font-medium text-gray-700"
                      >
                        #{shortId(order.id)}
                      </div>

                    </td>


                    {/* CUSTOMER */}

                    <td className="px-6 py-5">

                      <div className="max-w-[220px]">

                        <div className="font-semibold text-gray-900">
                          {order.user_name || '—'}
                        </div>

                        <div className="mt-1 truncate text-xs text-gray-500">
                          {order.user_email || '—'}
                        </div>

                      </div>

                    </td>


                    {/* PLAN */}

                    <td className="px-6 py-5">

                      <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
                        {order.plan_name || '—'}
                      </span>

                    </td>


                    {/* AMOUNT */}

                    <td className="px-6 py-5">

                      <div className="font-semibold text-gray-900">
                        {formatAmount(
                          order.amount,
                          order.currency
                        )}
                      </div>

                    </td>


                    {/* CHARACTERS */}

                    <td className="px-6 py-5">

                      <div className="text-sm text-gray-600">
                        {Number(
                          order.character_count || 0
                        ).toLocaleString('en-IN')}
                      </div>

                    </td>


                    {/* PAYMENT */}

                    <td className="px-6 py-5">

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          order.payment_status ===
                          'captured'
                            ? 'bg-green-50 text-green-700'
                            : order.payment_status ===
                              'failed'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-yellow-50 text-yellow-700'
                        }`}
                      >
                        {order.payment_status}
                      </span>

                    </td>


                    {/* AUDIO */}

                    <td className="px-6 py-5">

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          order.audio_status ===
                          'ready'
                            ? 'bg-green-50 text-green-700'
                            : order.audio_status ===
                              'failed'
                            ? 'bg-red-50 text-red-700'
                            : order.audio_status ===
                              'generating'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {order.audio_status}
                      </span>

                    </td>


                    {/* REFUND */}

                    <td className="px-6 py-5">

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          order.refund_status ===
                          'refunded'
                            ? 'bg-red-50 text-red-700'
                            : order.refund_status ===
                              'pending'
                            ? 'bg-yellow-50 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {order.refund_status}
                      </span>

                    </td>


                    {/* CREATED */}

                    <td className="px-6 py-5 text-sm text-gray-500">
                      {formatDate(
                        order.created_at
                      )}
                    </td>

                  </tr>

                )
              )}


              {/* EMPTY */}

              {filteredOrders.length === 0 && (

                <tr>

                  <td
                    colSpan={9}
                    className="px-6 py-16 text-center"
                  >

                    <CreditCard
                      size={32}
                      className="mx-auto text-gray-300"
                    />

                    <div className="mt-3 text-sm font-medium text-gray-700">

                      {orderSearch
                        ? 'No matching orders found.'
                        : 'No orders found.'}

                    </div>

                    <div className="mt-1 text-sm text-gray-400">

                      {orderSearch
                        ? 'Try another search.'
                        : 'Customer orders will appear here.'}

                    </div>

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      )}

    </div>

  </div>

)}

            {/* ==================================================
                PAYMENTS
            ================================================== */}

            {/* ==================================================
    PAYMENTS
================================================== */}

{tab === 'payments' && (

  <div>

    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">

      {/* HEADER */}

      <div className="border-b border-gray-100 px-6 py-5">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <h3 className="text-xl font-semibold text-gray-900">
              Payments
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Manage Razorpay payment transactions
            </p>

          </div>

          <div className="rounded-lg bg-gray-50 px-4 py-2 text-sm text-gray-600">

            <span className="font-semibold text-gray-900">
              {payments.length}
            </span>{' '}

            payments

          </div>

        </div>

      </div>


      {/* SEARCH */}

      <div className="border-b border-gray-100 px-6 py-4">

        <div className="relative max-w-lg">

          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            value={paymentSearch}
            onChange={(event) =>
              setPaymentSearch(
                event.target.value
              )
            }
            placeholder="Search payment ID, order ID, email..."
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
          />

        </div>

      </div>


      {/* ERROR */}

      {paymentsError && (

        <div className="mx-6 mt-5 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {paymentsError}
        </div>

      )}


      {/* LOADING */}

      {loadingPayments && (

        <div className="flex items-center justify-center px-6 py-16">

          <div className="text-sm text-gray-500">
            Loading payments...
          </div>

        </div>

      )}


      {/* TABLE */}

      {!loadingPayments && !paymentsError && (

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1400px] text-left">

            <thead className="border-b border-gray-100 bg-gray-50">

              <tr>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Payment
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Order
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Customer
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Amount
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Method
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Razorpay Payment
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Created
                </th>

              </tr>

            </thead>


            <tbody className="divide-y divide-gray-100">

              {filteredPayments.map(
                (payment) => (

                  <tr
                    key={payment.id}
                    className="hover:bg-gray-50"
                  >

                    {/* PAYMENT ID */}

                    <td className="px-6 py-5">

                      <div
                        title={payment.id}
                        className="font-mono text-xs font-medium text-gray-700"
                      >
                        #{shortId(payment.id)}
                      </div>

                    </td>


                    {/* ORDER ID */}

                    <td className="px-6 py-5">

                      <div
                        title={payment.order_id}
                        className="font-mono text-xs text-gray-600"
                      >
                        #{shortId(payment.order_id)}
                      </div>

                    </td>


                    {/* CUSTOMER */}

                    <td className="px-6 py-5">

                      <div className="max-w-[220px]">

                        <div className="font-semibold text-gray-900">
                          {payment.user_name || '—'}
                        </div>

                        <div className="mt-1 truncate text-xs text-gray-500">
                          {payment.user_email || '—'}
                        </div>

                      </div>

                    </td>


                    {/* AMOUNT */}

                    <td className="px-6 py-5">

                      <div className="font-semibold text-gray-900">
                        {formatAmount(
                          payment.amount,
                          payment.currency
                        )}
                      </div>

                    </td>


                    {/* METHOD */}

                    <td className="px-6 py-5">

                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                        {payment.payment_method || '—'}
                      </span>

                    </td>


                    {/* STATUS */}

                    <td className="px-6 py-5">

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          payment.status ===
                          'captured'
                            ? 'bg-green-50 text-green-700'
                            : payment.status ===
                              'failed'
                            ? 'bg-red-50 text-red-700'
                            : payment.status ===
                              'refunded'
                            ? 'bg-purple-50 text-purple-700'
                            : 'bg-yellow-50 text-yellow-700'
                        }`}
                      >
                        {payment.status}
                      </span>

                    </td>


                    {/* RAZORPAY PAYMENT ID */}

                    <td className="px-6 py-5">

                      <div
                        title={
                          payment.razorpay_payment_id ||
                          ''
                        }
                        className="font-mono text-xs text-gray-600"
                      >
                        {payment.razorpay_payment_id
                          ? shortId(
                              payment.razorpay_payment_id
                            )
                          : '—'}
                      </div>

                    </td>


                    {/* CREATED */}

                    <td className="px-6 py-5 text-sm text-gray-500">
                      {formatDate(
                        payment.created_at
                      )}
                    </td>

                  </tr>

                )
              )}


              {/* EMPTY */}

              {filteredPayments.length === 0 && (

                <tr>

                  <td
                    colSpan={8}
                    className="px-6 py-16 text-center"
                  >

                    <CreditCard
                      size={32}
                      className="mx-auto text-gray-300"
                    />

                    <div className="mt-3 text-sm font-medium text-gray-700">

                      {paymentSearch
                        ? 'No matching payments found.'
                        : 'No payments found.'}

                    </div>

                    <div className="mt-1 text-sm text-gray-400">

                      {paymentSearch
                        ? 'Try another search.'
                        : 'Payment transactions will appear here.'}

                    </div>

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      )}

    </div>

  </div>

)}

            {/* ==================================================
                PRICING
            ================================================== */}

            {/* ==================================================
    PRICING
================================================== */}

{tab === 'pricing' && (

  <div>

    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">

      {/* HEADER */}

      <div className="border-b border-gray-100 px-6 py-5">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <h3 className="text-xl font-semibold text-gray-900">
              Pricing
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Manage ProseText pricing plans
            </p>

          </div>

          <div className="rounded-lg bg-gray-50 px-4 py-2 text-sm text-gray-600">

            <span className="font-semibold text-gray-900">
              {pricing.length}
            </span>{' '}

            plans

          </div>

        </div>

      </div>


      {/* ERROR */}

      {pricingError && (

        <div className="mx-6 mt-5 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {pricingError}
        </div>

      )}


      {/* LOADING */}

      {loadingPricing && (

        <div className="flex items-center justify-center px-6 py-16">

          <div className="text-sm text-gray-500">
            Loading pricing...
          </div>

        </div>

      )}


      {/* PRICING TABLE */}

      {!loadingPricing && !pricingError && (

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1000px] text-left">

            <thead className="border-b border-gray-100 bg-gray-50">

              <tr>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Plan
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Price
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Included
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Max Characters
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Offer Price
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Offer Period
                </th>
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Action
                </th>

              </tr>

            </thead>


            <tbody className="divide-y divide-gray-100">

              {pricing.map(
                (plan) => (

                  <tr
                    key={plan.id}
                    className="hover:bg-gray-50"
                  >

                    {/* PLAN */}

                    <td className="px-6 py-5">

                      <div className="font-semibold text-gray-900">
                        {plan.name}
                      </div>

                      <div
                        title={plan.id}
                        className="mt-1 font-mono text-xs text-gray-400"
                      >
                        {shortId(plan.id)}
                      </div>

                    </td>


                    {/* PRICE */}

                    <td className="px-6 py-5">

                      <div className="text-lg font-bold text-gray-900">
                        {formatAmount(
                          plan.price,
                          plan.currency
                        )}
                      </div>

                    </td>


                    {/* INCLUDED */}

                    <td className="px-6 py-5">

                      <div className="text-sm text-gray-700">
                        {Number(
                          plan.included_characters
                        ).toLocaleString('en-IN')}
                      </div>

                    </td>


                    {/* MAX CHARACTERS */}

                    <td className="px-6 py-5">

                      <div className="text-sm text-gray-700">
                        {Number(
                          plan.max_characters
                        ).toLocaleString('en-IN')}
                      </div>

                    </td>


                    {/* OFFER PRICE */}

                    <td className="px-6 py-5">

                      {plan.offer_price !== null ? (

                        <div className="font-semibold text-purple-700">
                          {formatAmount(
                            plan.offer_price,
                            plan.currency
                          )}
                        </div>

                      ) : (

                        <span className="text-sm text-gray-400">
                          —
                        </span>

                      )}

                    </td>


                    {/* STATUS */}

                    <td className="px-6 py-5">

                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                          plan.is_active
                            ? 'bg-green-50 text-green-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >

                        <span
                          className={`h-2 w-2 rounded-full ${
                            plan.is_active
                              ? 'bg-green-500'
                              : 'bg-red-500'
                          }`}
                        />

                        {plan.is_active
                          ? 'Active'
                          : 'Inactive'}

                      </span>

                    </td>


                    {/* OFFER PERIOD */}

                    <td className="px-6 py-5">

                      <div className="text-xs text-gray-500">

                        <div>
                          {plan.offer_start
                            ? formatDate(
                                plan.offer_start
                              )
                            : 'No start date'}
                        </div>

                        <div className="mt-1">
                          {plan.offer_end
                            ? formatDate(
                                plan.offer_end
                              )
                            : 'No end date'}
                        </div>

                      </div>

                    </td>
                    <td className="px-6 py-5">
                      <button
                        type="button"
                        onClick={() => {
                          setPricingError('');
                          setPricingSuccess('');
                          setEditingPlan({ ...plan });
                        }}
                        className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
                      >
                        Edit
                      </button>
                    </td>

                  </tr>

                )
              )}


              {/* EMPTY */}

              {pricing.length === 0 && (

                <tr>

                  <td
                    colSpan={8}
                    className="px-6 py-16 text-center"
                  >

                    <Settings2
                      size={32}
                      className="mx-auto text-gray-300"
                    />

                    <div className="mt-3 text-sm font-medium text-gray-700">
                      No pricing plans found.
                    </div>

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      )}

    </div>

  </div>

)}

{/* ==================================================
    VOICES
================================================== */}

{tab === 'voices' && (

  <div>

    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">

      {/* HEADER */}

      <div className="border-b border-gray-100 px-6 py-5">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <h3 className="text-xl font-semibold text-gray-900">
              Voices
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Manage Google Cloud voices available in ProseText
            </p>

          </div>

          <div className="flex items-center gap-3">

            <div className="rounded-lg bg-gray-50 px-4 py-2 text-sm text-gray-600">

              <span className="font-semibold text-gray-900">
                {voices.length}
              </span>{' '}

              voices

            </div>

            <button
              type="button"
              onClick={async () => {

                try {

                  setSyncingVoices(true);
                  setVoicesError('');
                  setVoicesSuccess('');

                  const session = getSession();

                  if (!session?.access_token) {
                    throw new Error(
                      'Admin session not found.'
                    );
                  }

                  const apiUrl =
                    process.env.NEXT_PUBLIC_API_URL ||
                    'http://127.0.0.1:8000';

                  const response = await fetch(
                    `${apiUrl}/admin/voices/sync`,
                    {
                      method: 'POST',
                      headers: {
                        Authorization:
                          `Bearer ${session.access_token}`,
                        Accept: 'application/json',
                      },
                    }
                  );

                  const data =
                    await response.json();

                  console.log(
                    'Voice sync response:',
                    data
                  );

                  if (!response.ok) {
                    throw new Error(
                      data?.detail ||
                        'Unable to sync Google Cloud voices.'
                    );
                  }

                  setVoicesSuccess(
                    `Voice sync completed. ${data?.total_fetched ?? 0} voices fetched.`
                  );

                  // Reload voices after sync
                  const refreshResponse =
                    await fetch(
                      `${apiUrl}/admin/voices?t=${Date.now()}`,
                      {
                        method: 'GET',
                        cache: 'no-store',
                        headers: {
                          Authorization:
                            `Bearer ${session.access_token}`,
                          Accept: 'application/json',
                        },
                      }
                    );

                  const refreshData =
                    await refreshResponse.json();

                  if (!refreshResponse.ok) {
                    throw new Error(
                      refreshData?.detail ||
                        'Voices synced, but the latest voices could not be loaded.'
                    );
                  }

                  setVoices(
                    Array.isArray(
                      refreshData?.voices
                    )
                      ? refreshData.voices
                      : []
                  );

                } catch (error: any) {

                  console.error(
                    'Voice sync error:',
                    error
                  );

                  setVoicesError(
                    error?.message ||
                      'Unable to sync voices.'
                  );

                } finally {

                  setSyncingVoices(false);

                }

              }}
              disabled={syncingVoices}
              className="inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >

              <Volume2 size={17} />

              {syncingVoices
                ? 'Syncing...'
                : 'Sync Google Cloud Voices'}

            </button>

          </div>

        </div>

      </div>


      {/* SUCCESS */}

      {voicesSuccess && (

        <div className="mx-6 mt-5 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-700">
          {voicesSuccess}
        </div>

      )}


      {/* ERROR */}

      {voicesError && (

        <div className="mx-6 mt-5 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {voicesError}
        </div>

      )}


      {/* LOADING */}

      {loadingVoices && (

        <div className="flex items-center justify-center px-6 py-16">

          <div className="text-sm text-gray-500">
            Loading voices...
          </div>

        </div>

      )}


      {/* VOICE TABLE */}

      {!loadingVoices && !voicesError && (

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1100px] text-left">

            <thead className="border-b border-gray-100 bg-gray-50">

              <tr>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Voice
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Provider
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Voice ID
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Language
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Category
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Featured
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </th>

              </tr>

            </thead>


            <tbody className="divide-y divide-gray-100">

              {voices.map((voice) => (

                <tr
                  key={voice.id}
                  className="hover:bg-gray-50"
                >

                  {/* VOICE */}

                  <td className="px-6 py-5">

                    <div className="flex items-center gap-3">

                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-700">

                        <Volume2 size={18} />

                      </div>

                      <div>

                        <div className="font-semibold text-gray-900">
                          {voice.name || 'Unnamed voice'}
                        </div>

                        <div className="mt-1 max-w-[300px] truncate text-xs text-gray-500">
                          {voice.description || 'No description'}
                        </div>

                      </div>

                    </div>

                  </td>


                  {/* PROVIDER */}

                  <td className="px-6 py-5">

                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                      {voice.provider || '—'}
                    </span>

                  </td>


                  {/* VOICE ID */}

                  <td className="px-6 py-5">

                    <div
                      title={voice.provider_voice_id}
                      className="font-mono text-xs text-gray-600"
                    >
                      {shortId(
                        voice.provider_voice_id
                      )}
                    </div>

                  </td>


                  {/* LANGUAGE */}

                  <td className="px-6 py-5">

                    <div className="text-sm text-gray-700">
                      {voice.language_name ||
                        voice.language_code ||
                        '—'}
                    </div>

                  </td>


                  {/* CATEGORY */}

                  <td className="px-6 py-5">

                    <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
                      {voice.category || '—'}
                    </span>

                  </td>


                  {/* FEATURED */}

                  <td className="px-6 py-5">

                    {voice.is_featured ? (

                      <span className="rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700">
                        Featured
                      </span>

                    ) : (

                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                        No
                      </span>

                    )}

                  </td>


                  {/* STATUS */}

                  <td className="px-6 py-5">

                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                        voice.is_active
                          ? 'bg-green-50 text-green-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >

                      <span
                        className={`h-2 w-2 rounded-full ${
                          voice.is_active
                            ? 'bg-green-500'
                            : 'bg-red-500'
                        }`}
                      />

                      {voice.is_active
                        ? 'Active'
                        : 'Inactive'}

                    </span>

                  </td>

                </tr>

              ))}


              {/* EMPTY */}

              {voices.length === 0 && (

                <tr>

                  <td
                    colSpan={7}
                    className="px-6 py-16 text-center"
                  >

                    <Volume2
                      size={32}
                      className="mx-auto text-gray-300"
                    />

                    <div className="mt-3 text-sm font-medium text-gray-700">
                      No voices found.
                    </div>

                    <div className="mt-1 text-sm text-gray-400">
                      Click "Sync Google Cloud Voices" to import voices.
                    </div>

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      )}

    </div>

  </div>

)}


          </div>
                  {/* ============================================================
            EDIT PRICING MODAL
        ============================================================ */}

        {editingPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">

              {/* MODAL HEADER */}
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Edit Pricing Plan
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Update pricing, character limits and offer settings.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!savingPricing) {
                      setEditingPlan(null);
                    }
                  }}
                  className="rounded-lg px-3 py-2 text-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              {/* MODAL BODY */}
              <div className="max-h-[75vh] overflow-y-auto px-6 py-6">

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                  {/* PLAN NAME */}
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Plan Name
                    </label>

                    <input
                      type="text"
                      value={editingPlan.name}
                      onChange={(event) =>
                        setEditingPlan({
                          ...editingPlan,
                          name: event.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                      placeholder="Standard"
                    />
                  </div>

                  {/* PRICE */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Regular Price ({editingPlan.currency})
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editingPlan.price}
                      onChange={(event) =>
                        setEditingPlan({
                          ...editingPlan,
                          price: Number(event.target.value),
                        })
                      }
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                    />
                  </div>

                  {/* OFFER PRICE */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Offer Price ({editingPlan.currency})
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        editingPlan.offer_price === null
                          ? ''
                          : editingPlan.offer_price
                      }
                      onChange={(event) =>
                        setEditingPlan({
                          ...editingPlan,
                          offer_price:
                            event.target.value === ''
                              ? null
                              : Number(event.target.value),
                        })
                      }
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                      placeholder="Optional"
                    />

                    <p className="mt-1 text-xs text-gray-400">
                      Leave empty to disable the offer price.
                    </p>
                  </div>

                  {/* INCLUDED CHARACTERS */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Included Characters
                    </label>

                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={editingPlan.included_characters}
                      onChange={(event) =>
                        setEditingPlan({
                          ...editingPlan,
                          included_characters: Number(
                            event.target.value
                          ),
                        })
                      }
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                    />
                  </div>

                  {/* MAX CHARACTERS */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Maximum Characters
                    </label>

                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={editingPlan.max_characters}
                      onChange={(event) =>
                        setEditingPlan({
                          ...editingPlan,
                          max_characters: Number(
                            event.target.value
                          ),
                        })
                      }
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                    />
                  </div>

                  {/* OFFER START */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Offer Start
                    </label>

                    <input
                      type="datetime-local"
                      value={toDateTimeLocal(editingPlan.offer_start)}
                      onChange={(event) =>
                        setEditingPlan({
                          ...editingPlan,
                          offer_start: event.target.value
                            ? new Date(
                                event.target.value
                              ).toISOString()
                            : null,
                        })
                      }
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                    />
                  </div>

                  {/* OFFER END */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Offer End
                    </label>

                    <input
                      type="datetime-local"
                      value={toDateTimeLocal(editingPlan.offer_end)}
                      onChange={(event) =>
                        setEditingPlan({
                          ...editingPlan,
                          offer_end: event.target.value
                            ? new Date(
                                event.target.value
                              ).toISOString()
                            : null,
                        })
                      }
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                    />
                  </div>

                  {/* ACTIVE */}
                  <div className="md:col-span-2">
                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-4">
                      <input
                        type="checkbox"
                        checked={editingPlan.is_active}
                        onChange={(event) =>
                          setEditingPlan({
                            ...editingPlan,
                            is_active: event.target.checked,
                          })
                        }
                        className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />

                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          Active Plan
                        </div>

                        <div className="text-xs text-gray-500">
                          Allow customers to purchase this pricing plan.
                        </div>
                      </div>
                    </label>
                  </div>

                </div>

                {/* VALIDATION ERROR */}
                {pricingError && (
                  <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {pricingError}
                  </div>
                )}

              </div>

              {/* MODAL FOOTER */}
              <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-5">

                <button
                  type="button"
                  disabled={savingPricing}
                  onClick={() => {
                    setEditingPlan(null);
                    setPricingError('');
                  }}
                  className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={savingPricing}
                  onClick={() => savePricing(editingPlan)}
                  className="rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingPricing ? 'Saving...' : 'Save Changes'}
                </button>

              </div>

            </div>
          </div>
        )}

        </main>

      </div>
    </ProtectedShell>
  );
}