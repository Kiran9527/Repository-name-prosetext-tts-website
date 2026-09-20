# ProseText Auth + User/Admin Frontend

This update adds the frontend foundation for:

- `/login` — user sign-in
- `/signup` — account creation
- `/forgot-password` — password reset request
- `/reset-password` — password update page
- `/dashboard` — authenticated user workspace
- `/admin/login` — admin sign-in entry
- `/admin` — role-protected admin console

## Supabase configuration

Create/update the frontend `.env.local` with:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

Use only the Supabase **publishable** key in the browser. Never put the Supabase secret/service-role key in frontend environment variables.

## Supabase Auth settings

In Supabase:

1. Authentication → Providers → Email: enable it.
2. Configure email confirmation according to your launch policy.
3. Authentication → URL Configuration: add the local and production site URLs.
4. Make sure the `profiles` table has the authenticated user's profile and role.
5. Set the administrator profile `role` to `admin`.

## Important security note

This first frontend implementation keeps the auth session in browser storage and uses Supabase Auth REST endpoints directly, so it does not require an additional npm auth package. It is suitable for building/testing the UI, but the production version should move to HttpOnly-cookie/session handling and server-side role enforcement. The FastAPI backend must validate the Supabase JWT and enforce authorization for every protected operation; the frontend role check is only a UI guard.

## Next backend step

After the UI is approved, connect the authenticated Supabase user ID to FastAPI `/create-order`, then build database-backed user orders, payments, audio history, admin metrics, and pricing management.
