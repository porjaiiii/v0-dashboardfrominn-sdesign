# Dashboard login (users + admins) — design

Date: 2026-10-08
Branch: `feat/dashboard-login`

## Goal

Replace the dashboard's mock login (hard-coded emails in `lib/auth-context.tsx`), its browser-only LINE check, and the single shared `ADMIN_PASSWORD` with real per-person accounts that have one of two roles:

- **user**: can see the signed-in dashboard pages (`/map`, `/waste-types`) and their data APIs.
- **admin**: can additionally see `/admin/*` and call `/api/admin/*`, and can manage dashboard accounts.

The dashboard uses the same Supabase project as the waste management app, but **dashboard accounts are separate from waste-app accounts**. Waste-app users are identified by LINE (`app.users.line_user_id`). Dashboard accounts are email + password accounts in Supabase Auth and have nothing to do with LINE.

## Constraints (from the user)

1. Use Supabase Auth for credentials.
2. Dashboard accounts are separate from waste-app accounts.
3. The login feature must not read or write the `app` schema, and must not change it. A new `dashboard` schema is allowed.
4. Public sign-up is allowed, but a new account must be approved by an admin before it can log in.
5. Email about new sign-ups goes **only to the root admin**.
6. Email is sent through Gmail SMTP.
7. A sign-up must confirm the email address before the root admin is notified.
8. Creating an account must be atomic (Auth user + account row, both or neither).

## Decisions

| Topic | Decision |
|---|---|
| Credential check | Server calls Supabase Auth's REST password grant with `fetch` (no SDK, matching `lib/db/supabase-rest.ts`). Supabase's returned tokens are discarded. |
| Session | Dashboard's own HMAC-signed httpOnly cookie, `dash_session`, 12 h. |
| Role / status storage | Table `dashboard.accounts`. Not in `app_metadata`. |
| Atomic account creation | `after insert` trigger on `auth.users` creates the `dashboard.accounts` row in the same transaction. |
| Root admin | Exactly one, enforced by a partial unique index. Created by a script; moved by a script calling `dashboard.transfer_root()`. |
| Email | `nodemailer` + Gmail SMTP with a Google app password. |
| Supabase Auth public sign-up | Turned **off** in the project settings. Our server creates users via the admin API, which still works. |
| Supabase Auth email confirmation | Not used. We send our own confirmation link and then mark the Auth user confirmed. |
| Page gating | Unchanged pattern: the page shell asks `/api/auth/session` and redirects. All data comes from APIs, and the APIs enforce access. No `proxy.ts`. |

Why role and status live in a table rather than `app_metadata`: the table can be filtered and paged (pending list), the database enforces valid values and the single root, `transfer_root` can be one transaction, and there is only one copy to keep consistent. The usual benefit of `app_metadata` (role inside Supabase's JWT) doesn't apply because nothing uses Supabase's JWTs.

## Database: `supabase/dashboard_schema.sql`

Lives in this repo and is run once in the Supabase SQL editor (the waste app's migrations folder does not own it). Must be idempotent enough to re-run safely (`create ... if not exists`, `create or replace`, `drop trigger if exists`).

### Schema and table

```sql
create schema if not exists dashboard;

create table if not exists dashboard.accounts (
  id                   uuid primary key references auth.users(id) on delete cascade,
  email                text not null unique,          -- lowercase copy of auth.users.email
  full_name            text not null,
  role                 text not null default 'user',
  status               text not null default 'unverified',
  is_root              boolean not null default false,
  email_verified_at    timestamptz,
  approved_at          timestamptz,
  approved_by          uuid references dashboard.accounts(id) on delete set null,
  sessions_valid_after timestamptz not null default now(),
  last_email_sent_at   timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  constraint accounts_role_check   check (role in ('user', 'admin')),
  constraint accounts_status_check check (status in ('unverified', 'pending', 'active', 'disabled')),
  constraint accounts_root_is_active_admin check (not is_root or (role = 'admin' and status = 'active'))
);

create unique index if not exists accounts_single_root on dashboard.accounts (is_root) where is_root;
create index if not exists accounts_status_created on dashboard.accounts (status, created_at desc);
```

- An `updated_at` touch trigger on `dashboard.accounts`.
- Row-level security enabled with **no policies**.
- `revoke all` on the schema, tables and functions from `anon`, `authenticated`, `public`. `grant usage` on the schema and full table access to `service_role` only.

### Trigger on `auth.users` (atomic creation)

```sql
create or replace function dashboard.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.raw_app_meta_data ->> 'source' = 'dashboard' then
    insert into dashboard.accounts (id, email, full_name)
    values (new.id, lower(new.email), coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1)));
  end if;
  return new;
end;
$$;

drop trigger if exists dashboard_on_auth_user_created on auth.users;
create trigger dashboard_on_auth_user_created
  after insert on auth.users
  for each row execute function dashboard.handle_new_auth_user();
```

- Acts only on users created with `app_metadata.source = 'dashboard'`, so any future waste-app use of Supabase Auth is unaffected.
- Always inserts `role = 'user'`, `status = 'unverified'` (column defaults). It never reads a role from metadata, so it can't be used to create an admin.
- If the insert fails, Supabase Auth's user creation fails too and returns a generic "Database error creating new user". The API shows a generic "couldn't create account" message.

### `dashboard.transfer_root(p_new_root uuid)`

`security definer`, executable by `service_role` only. In one transaction:

1. Lock and check the target exists with `status = 'active'`; otherwise raise.
2. `update ... set is_root = false where is_root`.
3. `update ... set is_root = true, role = 'admin' where id = p_new_root`.

The old root stays an admin.

### Manual Supabase setup (one time, documented in `.env.example` and the PR)

1. Run `supabase/dashboard_schema.sql` in the SQL editor.
2. Settings → API → Exposed schemas: add `dashboard`.
3. Auth → Providers → Email: turn off "Allow new users to sign up".
4. Run `pnpm create-root-admin <email>`.

## Account lifecycle

```
sign up ──► unverified ──(click email link)──► pending ──(admin approve as user|admin)──► active
                                                  │                                        │
                                                  └──(admin reject)──► disabled ◄──(admin disable)
                                                                          │
                                                                          └──(admin enable)──► active
any non-root account ──(admin delete)──► gone (Auth user deleted; row cascades)
```

- **Sign up again with an email whose account is `unverified`**: replace the password (Auth admin API) and name (row), and resend the confirmation link (subject to the 60 s cooldown). Whoever controls the inbox ends up with the account.
- **Sign up with an email in any other status**: "this email is already registered".
- **Root account**: cannot be changed or deleted from the dashboard by anyone.
- **Your own account**: cannot be changed or deleted from the dashboard (prevents self-lockout).

## Tokens

One signer in `lib/auth/tokens.ts`: HMAC-SHA256 over a base64url JSON payload, keyed by `DASHBOARD_SESSION_SECRET`. Constant-time compare. Every payload carries a `purpose`, and verify rejects a token whose purpose differs from the one expected.

| Purpose | Payload | Lifetime | Single-use rule |
|---|---|---|---|
| `session` | `sub`, `iat`, `exp` | 12 h | Invalid if `iat` ≤ `sessions_valid_after` |
| `verify-email` | `sub`, `exp` | 24 h | Only acts while status is `unverified` |
| `reset-password` | `sub`, `sva` (the account's `sessions_valid_after` when issued), `exp` | 1 h | Invalid once `sessions_valid_after` changes, which a reset does |

All times in token payloads (`iat`, `exp`, `sva`) are epoch **milliseconds**, so a login in the same second as a password reset still compares correctly against `sessions_valid_after`.

`DASHBOARD_SESSION_SECRET` must be at least 32 characters. If it's missing or short, every auth route answers 503 and every guard denies.

## Session guard

`lib/auth/session.ts` → `getSessionAccount(req)`:

1. Read `dash_session`; verify signature, purpose, expiry.
2. Load the row from `dashboard.accounts` by `sub` (one PostgREST call).
3. Require `status = 'active'` and token `iat` > `sessions_valid_after`.
4. Return `{ id, email, fullName, role, isRoot }` or `null`.

`lib/db/route-helpers.ts`:

- `guardAdmin(req)` becomes async. It returns 401 when there's no valid session and 403 when the role isn't `admin`. `handle()` awaits it. The 8 existing admin data route files (`dashboard`, `formulas`, `reward-stock`, `rewards-overview`, `staff`, `summary`, `users`, `waste-records`) all go through `handle`/`listRoute` and need no edits.
- New `guardSignedIn(req)` (any active role) wraps `/api/waste-dashboard` and `/api/waste/dashboard`.

Effect: disable, delete, demote and password reset take effect on the person's next API request.

## API routes

All mutating routes check that the `Origin` header matches the request's own origin (pattern from the waste app's `lib/auth/same-origin.ts`). Responses are JSON with `Cache-Control: no-store`.

| Route | Who | Behaviour |
|---|---|---|
| `POST /api/auth/signup` `{fullName, email, password}` | public | Validate (name 1–100 chars, valid email, password ≥ 8). New email → Auth admin `create user` with `email_confirm: false`, `app_metadata.source = 'dashboard'`, `user_metadata.full_name`; trigger makes the row; send confirmation email. Unverified email → see lifecycle. Other status → 409 "already registered". |
| `POST /api/auth/verify-email` `{token}` | public | Valid token and status `unverified` → status `pending`, `email_verified_at = now()`, mark the Auth user's email confirmed, email the root admin. Returns `{ok}`; the page then goes to `/login?notice=verified`. Bad/expired/used → 400 and the page shows "link invalid or expired". (A POST from a button, not a GET, so email link scanners and prefetchers can't trigger it.) |
| `POST /api/auth/resend-verification` `{email}` | public | If the account exists and is `unverified` and the cooldown has passed, resend. Always answers `{ok: true}`. |
| `POST /api/auth/login` `{email, password, next?}` | public | Supabase password grant. Wrong credentials → 401 generic message after an 800 ms delay. Correct → load the row: `unverified` / `pending` / `disabled` → 403 with `reason`; `active` → set cookie, return `{redirect}`. |
| `POST /api/auth/logout` | any | Clear the cookie. |
| `GET /api/auth/session` | any | `{account}` or 401. |
| `POST /api/auth/forgot-password` `{email}` | public | If the account exists, isn't `disabled`, and the cooldown has passed, email a reset link. Always answers `{ok: true}`. |
| `POST /api/auth/reset-password` `{token, password}` | public | Valid token → Auth admin update password; `sessions_valid_after = now()`. |
| `GET /api/admin/accounts` | admin | `listRoute`: filters `status`, `q` (name/email), paging. |
| `PATCH /api/admin/accounts/[id]` `{action, role?}` | admin | `approve` (pending → active with `role`, sets `approved_at`/`approved_by`, emails the person), `reject` (pending → disabled, emails the person), `set-role`, `disable`, `enable`. Refused for the root account and for the caller's own account. Response includes `emailSent: boolean` where relevant. |
| `DELETE /api/admin/accounts/[id]` | admin | Auth admin delete user; the row cascades. Refused for root and self. |

**Login redirect**: admin → `/admin/dashboard`, user → `/map`. A `next` value is honoured only if it's an internal path (starts with `/`, not `//`) that the role may visit (`/admin/*` needs admin).

Removed routes: `/api/admin/login`, `/api/admin/logout`, `/api/admin/session`.

## Email (`lib/email.ts`)

- `nodemailer` transport for Gmail SMTP using `GMAIL_USER` and `GMAIL_APP_PASSWORD` (Google app password; the Gmail account needs 2-Step Verification).
- Links are built from `APP_BASE_URL` only, never from the request's Host header.
- Five Thai messages, plain text plus simple HTML: confirm email, new sign-up (to root, linking to `/admin/accounts?status=pending`), approved (with role and a link to `/login`), rejected, reset password.
- Cooldown: sign-up resends, resend-verification and forgot-password send at most one email per account per 60 s, tracked in `last_email_sent_at`.
- A send failure never undoes the action. It's logged, and the response tells the UI so it can show "saved, but the email couldn't be sent" or offer "resend".

## Pages and UI

All text in Thai. Auth pages reuse the green card style of the current `/login`; the admin page uses the existing navy admin components (`components/dashboard/admin-ui.tsx`, `useAdminList`).

New or rebuilt:

- `/login`: email + password; links to `/signup` and `/forgot-password`; shows `notice` banners and the `reason` messages, with a "resend confirmation email" button for `unverified`.
- `/signup`, `/forgot-password`, `/reset-password?token=`: single-form pages.
- `/verify-email?token=`: shows a "ยืนยันอีเมล" button that POSTs the token; this is where the confirmation email links to.
- `/admin/login`: redirects to `/login` (keeps `next`).
- `/admin/accounts` with sidebar item "บัญชีแดชบอร์ด":
  - Pending tab: name, email, sign-up date; approve as user, approve as admin, reject.
  - All tab: search, status filter, paging; promote/demote, disable/enable, delete (with confirmation).
  - Root row shows a "root" badge and no actions. The caller's own row shows no actions.
  - Kept separate from the existing "เจ้าหน้าที่" page, which lists the waste app's LINE admin keys.

Changed:

- `lib/site.ts` `LOGIN_HREF` → `/login`.
- `AdminShell`, `/map`, `/waste-types`: get the name from `/api/auth/session`; logout → `POST /api/auth/logout` then `/login`.
- `lib/use-dashboard.ts`, `lib/use-admin-list.ts`: 401 → `/login?next=…`; 403 → `/map`.
- `app/layout.tsx`: drop `AuthProvider` and `LiffProvider`.

Removed:

- `lib/auth-context.tsx`, `lib/liff-context.tsx`, the LINE button, the `@line/liff` dependency, `NEXT_PUBLIC_LIFF_ID`.
- `lib/db/admin-session.ts`; env `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `ADMIN_API_ALLOW_UNAUTHENTICATED`.
- The "open" auth mode. Logging in always needs Supabase. `lib/db/mock.ts` becomes unreachable but is left in place (out of scope).

## Scripts

Plain Node ESM, run with `node --env-file=.env.local`, no new dependencies. Both use `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`.

- `pnpm create-root-admin <email>`: refuse if a root exists or the email already has an account. Ask for the full name. Generate a random 20-character password and print it once. Create the Auth user (`email_confirm: true`, `app_metadata.source = 'dashboard'`); the trigger creates the row; then update the row to `role = 'admin'`, `status = 'active'`, `is_root = true`, `email_verified_at` and `approved_at` = now. If the second step fails, print the error and tell the operator to delete the Auth user and re-run.
- `pnpm transfer-root <email>`: look up the account by email and call `dashboard.transfer_root(id)` via PostgREST RPC.

## Configuration

| Variable | Status |
|---|---|
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Existing. Also used for the Auth password grant and admin API. |
| `DASHBOARD_SESSION_SECRET` | New, ≥ 32 chars (`openssl rand -base64 48`). |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD` | New. |
| `APP_BASE_URL` | New, e.g. `https://<dashboard>.vercel.app`, no trailing slash. |

`.env.example` is updated in Thai to match its current style.

`lib/db/supabase-rest.ts` gains an optional `schema` option on `sbSelect` / `sbUpdate` (default unchanged), plus small helpers for RPC and for the Auth REST endpoints (`/auth/v1/token?grant_type=password`, `/auth/v1/admin/users`).

To verify during implementation: that the password grant accepts the service-role / secret key as `apikey`. If it doesn't, add a server-only `SUPABASE_ANON_KEY` (publishable key) used for that one call.

## Error handling summary

| Situation | Result |
|---|---|
| Supabase or `DASHBOARD_SESSION_SECRET` not configured | Auth routes 503; guards deny; login page shows "ระบบยังไม่ได้ตั้งค่า" |
| Wrong email/password | 401 generic, 800 ms delay |
| Trigger/Auth create failure | 500 generic "couldn't create account" |
| Email send failure | Action kept; logged; UI informed |
| Cross-origin mutating request | 403 |
| Admin acting on root or self | 403 with a clear message |

## Testing

- Add `vitest` (dev dependency) with a `test` script.
- Unit tests, written before the code they cover:
  - tokens: round trip, tampered signature, expired, wrong purpose
  - session guard: each status, each role, `sessions_valid_after`
  - `safeNext` per role
  - sign-up decision per existing status
  - 60 s email cooldown
  - account action rules (root, self, valid transitions)
- Route tests with Supabase `fetch` and the mailer mocked: sign-up → verify → approve → login; login refusals by status; admin actions refused for root/self; 401 vs 403.
- Database: no Docker here, so the SQL is verified with a manual checklist run against the project: trigger creates a row only for `source = 'dashboard'`; second root insert fails; `transfer_root` moves root atomically; `anon` cannot read `dashboard.accounts`.
- `pnpm build` passes; manual end-to-end walk-through with a real Gmail account.

## Out of scope

- Changing your own password or email while logged in (forgot-password covers password changes).
- Removing `lib/db/mock.ts`.
- Any change to the waste app or the `app` schema.
- Cleaning up `unverified` accounts that never confirm (re-sign-up reuses them).
