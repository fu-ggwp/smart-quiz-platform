# Plan: Login/Register Auth Feature

## Summary

- Build complete `/login` and `/register` pages for Smart Quiz Platform using Next.js App Router, shadcn components, lucide icons, `react-hook-form`, `zod`, and semantic color variables from `client/src/styles/globals.css`.
- Add backend auth in feature-first structure under `server/src/features/auth`, without refactoring unrelated layer-based health files.
- Use Supabase for authentication. Register creates Supabase Auth user, `public.users`, and default `learner` role in `public.user_roles`. Login supports email or username, checks `account_status`, and returns profile/session.
- Redirect after successful login/register to `/`. Google login starts Supabase OAuth directly from frontend.

## Key Changes

- Frontend:
  - Inline auth screen implementation in `client/src/app/login/page.jsx` and `client/src/app/register/page.jsx`; no frontend `features` folder and no shared `AuthPage`.
  - Auth API helper lives under the existing service convention at `client/src/services/auth.js`.
  - Each page owns its own `react-hook-form` + `zod` schema, submit handler, Google OAuth handler, session persistence, and UI.
  - shadcn components: `button`, `input`, `label`, `checkbox`, `separator`, `field`.
  - Login fields: `identifier`, `password`, `rememberMe`.
  - Register fields: `fullName`, `username`, `email`, `password`, `confirmPassword`.
  - Google OAuth uses `supabase.auth.signInWithOAuth({ provider: "google" })`.

- Backend:
  - Add `POST /api/auth/register`.
  - Add `POST /api/auth/login`.
  - Validate inputs on backend.
  - Duplicate-check email and username.
  - Use Supabase Auth for credential operations and Supabase admin client for profile writes when available.

## Test Plan

- Backend:
  - Register success creates auth user, profile, and `learner` role.
  - Register rejects missing fields, invalid email, password mismatch, duplicate email, duplicate username.
  - Login succeeds with email and username.
  - Login rejects wrong credentials, unknown account, and unavailable account status.

- Frontend:
  - `npm run lint` in `client`.
  - `npm run build` in `client` if env vars are configured.
  - Desktop/mobile visual check for `/login` and `/register`.
  - Invalid forms show errors.
  - Valid login/register redirect to `/`.
  - Google button starts Supabase OAuth.

## Assumptions

- Backend has `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and preferably `SUPABASE_SERVICE_ROLE_KEY`.
- Existing DB schema in `docs/database-schema.md` is authoritative.
- Forgot/reset password, logout, dashboards, role switching, profile editing, and full Google callback profile-sync are out of scope.
