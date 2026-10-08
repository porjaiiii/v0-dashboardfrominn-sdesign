# Dashboard Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dashboard's mock email login, browser-only LINE check and shared `ADMIN_PASSWORD` with per-person email/password accounts (Supabase Auth) that have a `user` or `admin` role, an approval flow, and a root admin.

**Architecture:** Supabase Auth only stores email + password. Role, status and the root flag live in a new `dashboard.accounts` table, filled atomically by a trigger on `auth.users`. The server checks passwords through Supabase Auth's REST API with plain `fetch`, then issues its own HMAC-signed `dash_session` cookie. Every protected API call re-reads the account row, so disable/demote/delete/reset take effect immediately. Emails go out through Gmail SMTP (`nodemailer`).

**Tech Stack:** Next.js 16 (App Router, route handlers), React 19, TypeScript, Supabase (PostgREST + GoTrue REST via `fetch`), `nodemailer`, `vitest`.

**Spec:** `docs/superpowers/specs/2026-10-08-dashboard-login-design.md`

## Global Constraints

- Login code never reads or writes the `app` schema. Only `dashboard.*` and Supabase Auth.
- No Supabase SDK. All Supabase calls use `fetch` (pattern of `lib/db/supabase-rest.ts`).
- No secret in a `NEXT_PUBLIC_` variable. Supabase is never called from the browser.
- All user-facing text is Thai. Code style matches the repo: no semicolons, single quotes, 2-space indent, short Thai comments.
- Cookie `dash_session`: httpOnly, `SameSite=Lax`, `Secure` in production, 12 h.
- Token times (`iat`, `exp`, `sva`) are epoch **milliseconds**.
- Verify-email link lifetime 24 h; reset-password link lifetime 1 h.
- Password length 8–72 characters. Full name 1–100 characters.
- At most one email per account per 60 s for sign-up / resend / forgot-password (`last_email_sent_at`).
- Email links are built only from `APP_BASE_URL`, never from the request's Host header.
- `DASHBOARD_SESSION_SECRET` must be ≥ 32 characters; if missing, auth routes answer 503 and guards deny.
- Every mutating auth/admin-account route checks the `Origin` header.
- Root account and the caller's own account cannot be changed or deleted from the dashboard.
- Deviation from the spec (deliberate): Auth users are created with `email_confirm: true` from the start, so Supabase's own "Email not confirmed" check never interferes with our password check. Our `status` column is the only confirmation state. The spec is updated in Task 1.

## Review Focus

1. Email typed with different case or spaces at sign-up and login (`"  Somchai@Example.COM "`) must reach the same account. Test added in Task 7 (signup) and Task 8 (login).
2. Gmail not configured in an environment: sign-up must still create the account and answer `emailSent: false`, not 500. Test added in Task 7.
3. A confirmation or reset link used twice (double click, mail scanner, back button) must answer "link invalid or used" the second time, without side effects. Tests added in Task 7 (verify) and Task 8 (reset).
4. Two admins acting on the same pending account at once: the second must get 409, not silently overwrite. Test added in Task 9.
5. Supabase Auth rate-limits the password check (429): login must answer 429 with a Thai message, not 500. Test added in Task 8.

---

## File Structure

New server modules (`lib/auth/`):

| File | Responsibility |
|---|---|
| `lib/auth/config.ts` | Read `DASHBOARD_SESSION_SECRET`, `APP_BASE_URL`; `authConfigured()` |
| `lib/auth/tokens.ts` | HMAC sign/verify with a `purpose` |
| `lib/auth/policy.ts` | Pure rules shared by server and browser: roles, statuses, labels, validation, `safeNext`, sign-up decision, admin action plans |
| `lib/auth/accounts.ts` | `dashboard.accounts` reads/writes via PostgREST |
| `lib/auth/supabase-auth.ts` | Supabase Auth REST: password check, create/update/delete user |
| `lib/auth/session.ts` | `dash_session` cookie set/clear/read → `SessionAccount` |
| `lib/auth/http.ts` | Response helpers, same-origin check, `requireAccount`, route wrappers |
| `lib/auth/mailers.ts` | Build links + tokens, apply cooldown, send each email |
| `lib/email-templates.ts` | Pure Thai email bodies |
| `lib/email.ts` | Gmail SMTP transport (`sendMail`) |

New client modules: `lib/auth-client.ts` (fetch helpers, redirects), `lib/use-session.ts` (session hook), `components/auth/AuthCard.tsx` (auth page UI), `components/dashboard/UserAccountMenu.tsx` (green header menu).

Routes: `app/api/auth/{signup,verify-email,resend-verification,login,logout,session,forgot-password,reset-password}/route.ts`, `app/api/admin/accounts/route.ts`, `app/api/admin/accounts/[id]/route.ts`.

Pages: `app/login`, `app/signup`, `app/verify-email`, `app/forgot-password`, `app/reset-password`, `app/admin/login` (redirect), `app/admin/accounts`.

Database and scripts: `supabase/dashboard_schema.sql`, `supabase/dashboard_schema_checks.sql`, `scripts/lib.mjs`, `scripts/create-root-admin.mjs`, `scripts/transfer-root.mjs`.

Tests: unit tests next to the module (`lib/**/*.test.ts`), route tests in `tests/routes/`, shared fixtures in `tests/fixtures.ts`.

Removed: `lib/auth-context.tsx`, `lib/liff-context.tsx`, `lib/db/admin-session.ts`, `app/api/admin/{login,logout,session}/route.ts`, dependency `@line/liff`.

Baseline: `pnpm exec tsc --noEmit -p .` currently reports exactly one pre-existing error, in `components/dashboard/TopContributors.tsx(37,143)`. The final check is "no other errors".

---

### Task 1: Test tooling, config and signed tokens

**Files:**
- Modify: `package.json` (add `vitest`, `test` script)
- Create: `vitest.config.mts`
- Create: `lib/auth/config.ts`
- Create: `lib/auth/tokens.ts`
- Test: `lib/auth/tokens.test.ts`
- Modify: `docs/superpowers/specs/2026-10-08-dashboard-login-design.md` (record the `email_confirm: true` deviation)

**Interfaces:**
- Produces:
  - `sessionSecret(): string | null`, `authConfigured(): boolean`, `appBaseUrl(): string | null`, `MIN_SECRET_LENGTH = 32` (config.ts)
  - `type TokenPurpose = 'session' | 'verify-email' | 'reset-password'`
  - `interface TokenClaims { sub: string; exp: number; iat?: number; sva?: number }`
  - `signToken(secret: string, purpose: TokenPurpose, claims: TokenClaims): string`
  - `verifyToken(secret: string, purpose: TokenPurpose, token: string | undefined, now?: number): TokenClaims | null`

- [ ] **Step 1: Install vitest and add the test script**

Run: `pnpm add -D vitest@^4`
(If pnpm complains about the workspace root, run `pnpm add -w -D vitest@^4`.)

Then in `package.json` `"scripts"` add `"test": "vitest run"` after `"lint"`.

- [ ] **Step 2: Create `vitest.config.mts`**

```ts
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    // ให้ import '@/...' ทำงานเหมือนใน Next (tsconfig paths)
    alias: [{ find: /^@\//, replacement: fileURLToPath(new URL('./', import.meta.url)) }],
  },
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts', 'tests/**/*.test.ts'],
  },
})
```

- [ ] **Step 3: Write the failing token tests** — `lib/auth/tokens.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { signToken, verifyToken } from './tokens'

const SECRET = 'x'.repeat(32)
const NOW = 1_800_000_000_000

describe('signed tokens', () => {
  it('round-trips the claims for the same purpose', () => {
    const token = signToken(SECRET, 'session', { sub: 'abc', iat: NOW, exp: NOW + 1000 })
    expect(verifyToken(SECRET, 'session', token, NOW)).toMatchObject({ sub: 'abc', iat: NOW, exp: NOW + 1000 })
  })

  it('rejects a token made for another purpose', () => {
    const token = signToken(SECRET, 'verify-email', { sub: 'abc', exp: NOW + 1000 })
    expect(verifyToken(SECRET, 'session', token, NOW)).toBeNull()
    expect(verifyToken(SECRET, 'reset-password', token, NOW)).toBeNull()
  })

  it('rejects a payload swapped under a valid signature', () => {
    const [, signature] = signToken(SECRET, 'session', { sub: 'abc', exp: NOW + 1000 }).split('.')
    const forged = Buffer.from(JSON.stringify({ sub: 'someone-else', exp: NOW + 1000, purpose: 'session' })).toString('base64url')
    expect(verifyToken(SECRET, 'session', `${forged}.${signature}`, NOW)).toBeNull()
  })

  it('rejects a token signed with another secret', () => {
    const token = signToken('y'.repeat(32), 'session', { sub: 'abc', exp: NOW + 1000 })
    expect(verifyToken(SECRET, 'session', token, NOW)).toBeNull()
  })

  it('treats exp equal to now as expired', () => {
    const token = signToken(SECRET, 'session', { sub: 'abc', exp: NOW })
    expect(verifyToken(SECRET, 'session', token, NOW)).toBeNull()
    expect(verifyToken(SECRET, 'session', token, NOW - 1)).not.toBeNull()
  })

  it('rejects missing and malformed tokens', () => {
    for (const bad of [undefined, '', 'abc', 'a.b.c', '.', 'a.', '.b']) {
      expect(verifyToken(SECRET, 'session', bad, NOW)).toBeNull()
    }
  })

  it('refuses to verify with a secret shorter than 32 characters', () => {
    const short = 'z'.repeat(31)
    const token = signToken(short, 'session', { sub: 'abc', exp: NOW + 1000 })
    expect(verifyToken(short, 'session', token, NOW)).toBeNull()
  })
})
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `pnpm test lib/auth/tokens.test.ts`
Expected: FAIL — `Failed to resolve import "./tokens"`.

- [ ] **Step 5: Create `lib/auth/config.ts`**

```ts
/** ค่าตั้งของระบบล็อกอินแดชบอร์ด (อ่านจาก env ทุกครั้งที่เรียก) */

import { readEnv } from '@/lib/google-sheets'
import { isSupabaseConfigured } from '@/lib/db/supabase-rest'

export const MIN_SECRET_LENGTH = 32

/** คีย์เซ็น cookie และลิงก์ในอีเมล — สั้นกว่า 32 ตัวถือว่ายังไม่ได้ตั้ง */
export function sessionSecret(): string | null {
  const secret = readEnv('DASHBOARD_SESSION_SECRET')
  return secret && secret.length >= MIN_SECRET_LENGTH ? secret : null
}

export function authConfigured(): boolean {
  return isSupabaseConfigured() && sessionSecret() !== null
}

/** URL ของเว็บสำหรับใส่ในอีเมล — บน production ต้องตั้ง APP_BASE_URL (ห้ามเดาจาก Host header) */
export function appBaseUrl(): string | null {
  const base = readEnv('APP_BASE_URL') ?? (process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:3000')
  return base ? base.replace(/\/+$/, '') : null
}
```

- [ ] **Step 6: Create `lib/auth/tokens.ts`**

```ts
/**
 * token แบบเซ็นด้วย HMAC-SHA256: base64url(JSON).signature
 * ทุก token มี purpose — token ที่ออกให้งานหนึ่ง (เช่นลิงก์ยืนยันอีเมล) ใช้แทนอีกงาน (cookie เซสชัน) ไม่ได้
 */

import { createHmac, timingSafeEqual } from 'crypto'
import { MIN_SECRET_LENGTH } from './config'

export type TokenPurpose = 'session' | 'verify-email' | 'reset-password'

export interface TokenClaims {
  sub: string
  /** epoch ms */
  exp: number
  /** epoch ms — เวลาออก token (cookie เซสชัน) */
  iat?: number
  /** epoch ms — sessions_valid_after ตอนออกลิงก์รีเซ็ตรหัสผ่าน */
  sva?: number
}

const mac = (secret: string, body: string) => createHmac('sha256', secret).update(body).digest('base64url')

export function signToken(secret: string, purpose: TokenPurpose, claims: TokenClaims): string {
  const body = Buffer.from(JSON.stringify({ ...claims, purpose })).toString('base64url')
  return `${body}.${mac(secret, body)}`
}

export function verifyToken(
  secret: string,
  purpose: TokenPurpose,
  token: string | undefined,
  now = Date.now(),
): TokenClaims | null {
  if (!token || secret.length < MIN_SECRET_LENGTH) return null
  const parts = token.split('.')
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null
  const [body, signature] = parts

  const expected = Buffer.from(mac(secret, body))
  const given = Buffer.from(signature)
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null

  let claims: Record<string, unknown>
  try {
    claims = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
  } catch {
    return null
  }
  if (!claims || typeof claims !== 'object') return null
  if (claims.purpose !== purpose) return null
  if (typeof claims.sub !== 'string' || !claims.sub) return null
  if (typeof claims.exp !== 'number' || claims.exp <= now) return null
  return claims as unknown as TokenClaims
}
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `pnpm test lib/auth/tokens.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 8: Record the `email_confirm` deviation in the spec**

In `docs/superpowers/specs/2026-10-08-dashboard-login-design.md`:
- In the Decisions table, replace the row starting `| Supabase Auth email confirmation |` with:
  `| Supabase Auth email confirmation | Not used. Auth users are created with \`email_confirm: true\`; our \`status\` column (\`unverified\` → \`pending\`) is the only confirmation state, so Supabase's "Email not confirmed" check never blocks the password check. |`
- In the API table row for `POST /api/auth/signup`, replace `with \`email_confirm: false\`` with `with \`email_confirm: true\``.
- In the API table row for `POST /api/auth/verify-email`, delete `, mark the Auth user's email confirmed`.

- [ ] **Step 9: Commit**

```bash
git add package.json pnpm-lock.yaml vitest.config.mts lib/auth/config.ts lib/auth/tokens.ts lib/auth/tokens.test.ts docs/superpowers/specs/2026-10-08-dashboard-login-design.md
git commit -m "feat: Add vitest and signed tokens for dashboard login

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Account rules (pure policy)

**Files:**
- Create: `lib/auth/policy.ts`
- Test: `lib/auth/policy.test.ts`

**Interfaces:**
- Produces (all pure, safe to import from client components):
  - `type Role = 'user' | 'admin'`, `type AccountStatus = 'unverified' | 'pending' | 'active' | 'disabled'`
  - `ROLES`, `ACCOUNT_STATUSES`, `ROLE_LABELS`, `STATUS_LABELS`, `LOGIN_BLOCK_MESSAGES`
  - `LINK_INVALID_MESSAGE`, `STALE_MESSAGE`
  - `PASSWORD_MIN_LENGTH = 8`, `PASSWORD_MAX_LENGTH = 72`, `EMAIL_COOLDOWN_MS = 60_000`, `VERIFY_EMAIL_TTL_MS`, `RESET_PASSWORD_TTL_MS`
  - `isRole(v: unknown): v is Role`, `normalizeEmail(v: string): string`, `isEmail(v: string): boolean`, `cleanName(v: string): string`
  - `passwordError(p: string): string | null`, `signupError(input: { fullName: string; email: string; password: string }): string | null`
  - `type SignupDecision = 'create' | 'refresh-unverified' | 'already-registered'`, `signupDecision(existing: AccountStatus | null): SignupDecision`
  - `HOME_BY_ROLE: Record<Role, string>`, `safeNext(next: unknown, role: Role): string`
  - `interface ActionSubject { id: string; status: AccountStatus; is_root: boolean }`
  - `type Refusal = { ok: false; status: 400 | 403 | 409; error: string }`
  - `type ActionPlan = { ok: true; expectStatus: AccountStatus; patch: Record<string, unknown>; notify?: 'approved' | 'rejected' } | Refusal`
  - `protectedRefusal(actorId: string, target: ActionSubject): Refusal | null`
  - `planAccountAction(actorId: string, target: ActionSubject, action: unknown, role: unknown, now?: Date): ActionPlan`

- [ ] **Step 1: Write the failing tests** — `lib/auth/policy.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import {
  cleanName,
  normalizeEmail,
  planAccountAction,
  protectedRefusal,
  safeNext,
  signupDecision,
  signupError,
  type ActionSubject,
} from './policy'

describe('input rules', () => {
  it('normalizes email case and whitespace', () => {
    expect(normalizeEmail('  Somchai@Example.COM ')).toBe('somchai@example.com')
  })

  it('strips control characters from names', () => {
    expect(cleanName(' สมชาย\r\nใจดี\u0000 ')).toBe('สมชาย ใจดี')
  })

  it('validates sign-up input', () => {
    const good = { fullName: 'สมชาย', email: 'a@b.co', password: '12345678' }
    expect(signupError(good)).toBeNull()
    expect(signupError({ ...good, fullName: '' })).toMatch(/ชื่อ/)
    expect(signupError({ ...good, fullName: 'ก'.repeat(101) })).toMatch(/ชื่อ/)
    expect(signupError({ ...good, email: 'not-an-email' })).toMatch(/อีเมล/)
    expect(signupError({ ...good, password: '1234567' })).toMatch(/อย่างน้อย 8/)
    expect(signupError({ ...good, password: 'x'.repeat(73) })).toMatch(/ไม่เกิน 72/)
  })
})

describe('signupDecision', () => {
  it('creates, refreshes or refuses by existing status', () => {
    expect(signupDecision(null)).toBe('create')
    expect(signupDecision('unverified')).toBe('refresh-unverified')
    expect(signupDecision('pending')).toBe('already-registered')
    expect(signupDecision('active')).toBe('already-registered')
    expect(signupDecision('disabled')).toBe('already-registered')
  })
})

describe('safeNext', () => {
  it('sends each role home by default', () => {
    expect(safeNext(undefined, 'admin')).toBe('/admin/dashboard')
    expect(safeNext(null, 'user')).toBe('/map')
  })

  it('keeps internal paths the role may visit', () => {
    expect(safeNext('/admin/users?page=2', 'admin')).toBe('/admin/users?page=2')
    expect(safeNext('/waste-types', 'user')).toBe('/waste-types')
  })

  it('never sends a user into /admin', () => {
    expect(safeNext('/admin/users', 'user')).toBe('/map')
    expect(safeNext('/admin', 'user')).toBe('/map')
  })

  it('rejects open-redirect shapes', () => {
    for (const bad of ['https://evil.com', '//evil.com', '/\\evil.com', '/\t/evil.com', 'evil.com', '']) {
      expect(safeNext(bad, 'admin')).toBe('/admin/dashboard')
    }
  })

  it('does not bounce back to auth pages', () => {
    expect(safeNext('/login?next=/x', 'admin')).toBe('/admin/dashboard')
    expect(safeNext('/admin/login', 'admin')).toBe('/admin/dashboard')
  })
})

describe('admin account actions', () => {
  const ACTOR = 'actor-id'
  const target = (over: Partial<ActionSubject> = {}): ActionSubject => ({ id: 'target-id', status: 'pending', is_root: false, ...over })
  const NOW = new Date('2026-10-08T03:00:00.000Z')

  it('refuses to touch the root account or your own account', () => {
    expect(protectedRefusal(ACTOR, target({ is_root: true }))).toMatchObject({ status: 403 })
    expect(protectedRefusal(ACTOR, target({ id: ACTOR }))).toMatchObject({ status: 403 })
    expect(protectedRefusal(ACTOR, target())).toBeNull()
    expect(planAccountAction(ACTOR, target({ is_root: true }), 'approve', 'user')).toMatchObject({ ok: false, status: 403 })
  })

  it('approves a pending account with the chosen role', () => {
    expect(planAccountAction(ACTOR, target(), 'approve', 'admin', NOW)).toEqual({
      ok: true,
      expectStatus: 'pending',
      patch: { status: 'active', role: 'admin', approved_at: NOW.toISOString(), approved_by: ACTOR },
      notify: 'approved',
    })
  })

  it('needs a valid role to approve or change role', () => {
    expect(planAccountAction(ACTOR, target(), 'approve', 'superadmin')).toMatchObject({ ok: false, status: 400 })
    expect(planAccountAction(ACTOR, target({ status: 'active' }), 'set-role', undefined)).toMatchObject({ ok: false, status: 400 })
  })

  it('rejects a pending account and notifies', () => {
    expect(planAccountAction(ACTOR, target(), 'reject', undefined)).toEqual({
      ok: true,
      expectStatus: 'pending',
      patch: { status: 'disabled' },
      notify: 'rejected',
    })
  })

  it('changes role, disables and re-enables without notifying', () => {
    expect(planAccountAction(ACTOR, target({ status: 'active' }), 'set-role', 'admin')).toEqual({
      ok: true,
      expectStatus: 'active',
      patch: { role: 'admin' },
    })
    expect(planAccountAction(ACTOR, target({ status: 'active' }), 'disable', undefined)).toEqual({
      ok: true,
      expectStatus: 'active',
      patch: { status: 'disabled' },
    })
    expect(planAccountAction(ACTOR, target({ status: 'disabled' }), 'enable', undefined, NOW)).toEqual({
      ok: true,
      expectStatus: 'disabled',
      patch: { status: 'active', approved_at: NOW.toISOString(), approved_by: ACTOR },
    })
  })

  it('answers 409 when the account is not in the status the action needs', () => {
    expect(planAccountAction(ACTOR, target({ status: 'active' }), 'approve', 'user')).toMatchObject({ ok: false, status: 409 })
    expect(planAccountAction(ACTOR, target({ status: 'unverified' }), 'reject', undefined)).toMatchObject({ ok: false, status: 409 })
    expect(planAccountAction(ACTOR, target({ status: 'pending' }), 'disable', undefined)).toMatchObject({ ok: false, status: 409 })
  })

  it('answers 400 for an unknown action', () => {
    expect(planAccountAction(ACTOR, target(), 'promote-to-god', undefined)).toMatchObject({ ok: false, status: 400 })
    expect(planAccountAction(ACTOR, target(), '', undefined)).toMatchObject({ ok: false, status: 400 })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test lib/auth/policy.test.ts`
Expected: FAIL — `Failed to resolve import "./policy"`.

- [ ] **Step 3: Create `lib/auth/policy.ts`**

```ts
/**
 * กติกาของบัญชีแดชบอร์ด — ฟังก์ชันล้วน ไม่มี I/O
 * ใช้ได้ทั้งฝั่งเซิร์ฟเวอร์และเบราว์เซอร์ (ห้าม import โมดูลฝั่งเซิร์ฟเวอร์ในไฟล์นี้)
 */

export type Role = 'user' | 'admin'
export type AccountStatus = 'unverified' | 'pending' | 'active' | 'disabled'

export const ROLES: readonly Role[] = ['user', 'admin']
export const ACCOUNT_STATUSES: readonly AccountStatus[] = ['unverified', 'pending', 'active', 'disabled']

export const ROLE_LABELS: Record<Role, string> = { user: 'ผู้ใช้', admin: 'แอดมิน' }

export const STATUS_LABELS: Record<AccountStatus, string> = {
  unverified: 'ยังไม่ยืนยันอีเมล',
  pending: 'รออนุมัติ',
  active: 'ใช้งาน',
  disabled: 'ปิดใช้งาน',
}

/** ข้อความเมื่อรหัสผ่านถูกแต่ยังเข้าใช้ไม่ได้ (แสดงหลังตรวจรหัสผ่านแล้วเท่านั้น) */
export const LOGIN_BLOCK_MESSAGES: Record<Exclude<AccountStatus, 'active'>, string> = {
  unverified: 'กรุณายืนยันอีเมลก่อน โดยกดลิงก์ในอีเมลที่เราส่งให้',
  pending: 'บัญชีของคุณกำลังรอผู้ดูแลระบบอนุมัติ เราจะแจ้งทางอีเมลเมื่ออนุมัติแล้ว',
  disabled: 'บัญชีนี้ถูกปิดใช้งาน กรุณาติดต่อผู้ดูแลระบบ',
}

export const LINK_INVALID_MESSAGE = 'ลิงก์ไม่ถูกต้อง หมดอายุ หรือถูกใช้ไปแล้ว'
export const STALE_MESSAGE = 'สถานะบัญชีเปลี่ยนไปแล้ว กรุณาโหลดหน้าใหม่'

export const PASSWORD_MIN_LENGTH = 8
/** bcrypt ของ Supabase Auth รับได้ไม่เกิน 72 ไบต์ */
export const PASSWORD_MAX_LENGTH = 72
export const EMAIL_COOLDOWN_MS = 60_000
export const VERIFY_EMAIL_TTL_MS = 24 * 60 * 60 * 1000
export const RESET_PASSWORD_TTL_MS = 60 * 60 * 1000

export const isRole = (v: unknown): v is Role => v === 'user' || v === 'admin'
export const normalizeEmail = (v: string) => v.trim().toLowerCase()
export const isEmail = (v: string) => v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
export const cleanName = (v: string) => v.replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/ {2,}/g, ' ').trim()

export function passwordError(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) return `รหัสผ่านต้องมีอย่างน้อย ${PASSWORD_MIN_LENGTH} ตัวอักษร`
  if (password.length > PASSWORD_MAX_LENGTH) return `รหัสผ่านต้องไม่เกิน ${PASSWORD_MAX_LENGTH} ตัวอักษร`
  return null
}

export function signupError(input: { fullName: string; email: string; password: string }): string | null {
  if (!input.fullName || input.fullName.length > 100) return 'กรุณากรอกชื่อ (ไม่เกิน 100 ตัวอักษร)'
  if (!isEmail(input.email)) return 'รูปแบบอีเมลไม่ถูกต้อง'
  return passwordError(input.password)
}

export type SignupDecision = 'create' | 'refresh-unverified' | 'already-registered'

/** อีเมลที่ยังไม่ยืนยันสมัครซ้ำได้ (คนที่เข้าอีเมลได้จริงจะได้บัญชีไป) — สถานะอื่นถือว่าลงทะเบียนแล้ว */
export function signupDecision(existing: AccountStatus | null): SignupDecision {
  if (existing === null) return 'create'
  return existing === 'unverified' ? 'refresh-unverified' : 'already-registered'
}

export const HOME_BY_ROLE: Record<Role, string> = { admin: '/admin/dashboard', user: '/map' }

const AUTH_PAGES = ['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email', '/admin/login']

/** ปลายทางหลังล็อกอิน — รับเฉพาะ path ภายในที่บทบาทนั้นเข้าได้ (กัน open redirect) */
export function safeNext(next: unknown, role: Role): string {
  const home = HOME_BY_ROLE[role]
  if (typeof next !== 'string' || !next.startsWith('/') || next.startsWith('//')) return home
  // เบราว์เซอร์ตัด tab/ขึ้นบรรทัดออกจาก URL และมอง \ เป็น / → "/\t/evil.com" กลายเป็น "//evil.com"
  if (next.includes('\\') || /[\u0000-\u001f\u007f]/.test(next)) return home
  const path = next.split(/[?#]/)[0]
  if (AUTH_PAGES.includes(path)) return home
  if (role !== 'admin' && (path === '/admin' || path.startsWith('/admin/'))) return home
  return next
}

/* ───────────── การจัดการบัญชีโดยแอดมิน ───────────── */

export interface ActionSubject {
  id: string
  status: AccountStatus
  is_root: boolean
}

export type Refusal = { ok: false; status: 400 | 403 | 409; error: string }

export type ActionPlan =
  | { ok: true; expectStatus: AccountStatus; patch: Record<string, unknown>; notify?: 'approved' | 'rejected' }
  | Refusal

type Allowed = Extract<ActionPlan, { ok: true }>

const STALE: Refusal = { ok: false, status: 409, error: STALE_MESSAGE }
const BAD_ROLE: Refusal = { ok: false, status: 400, error: 'บทบาทไม่ถูกต้อง' }

/** บัญชี root และบัญชีของตัวเองแก้ไข/ลบจากหน้าแดชบอร์ดไม่ได้ */
export function protectedRefusal(actorId: string, target: ActionSubject): Refusal | null {
  if (target.is_root) return { ok: false, status: 403, error: 'บัญชี root แก้ไขหรือลบจากหน้านี้ไม่ได้' }
  if (target.id === actorId) return { ok: false, status: 403, error: 'แก้ไขหรือลบบัญชีของตัวเองไม่ได้' }
  return null
}

function whenStatus(target: ActionSubject, status: AccountStatus, plan: Omit<Allowed, 'ok' | 'expectStatus'>): ActionPlan {
  return target.status === status ? { ok: true, expectStatus: status, ...plan } : STALE
}

/**
 * แปลงคำสั่งของแอดมินเป็นการอัปเดต — expectStatus ใช้เป็นเงื่อนไขตอนอัปเดต
 * เพื่อให้แอดมินสองคนกดพร้อมกันได้ 409 แทนการเขียนทับกัน
 */
export function planAccountAction(
  actorId: string,
  target: ActionSubject,
  action: unknown,
  role: unknown,
  now = new Date(),
): ActionPlan {
  const refusal = protectedRefusal(actorId, target)
  if (refusal) return refusal
  const at = now.toISOString()

  switch (action) {
    case 'approve':
      if (!isRole(role)) return BAD_ROLE
      return whenStatus(target, 'pending', {
        patch: { status: 'active', role, approved_at: at, approved_by: actorId },
        notify: 'approved',
      })
    case 'reject':
      return whenStatus(target, 'pending', { patch: { status: 'disabled' }, notify: 'rejected' })
    case 'set-role':
      if (!isRole(role)) return BAD_ROLE
      return whenStatus(target, 'active', { patch: { role } })
    case 'disable':
      return whenStatus(target, 'active', { patch: { status: 'disabled' } })
    case 'enable':
      return whenStatus(target, 'disabled', { patch: { status: 'active', approved_at: at, approved_by: actorId } })
    default:
      return { ok: false, status: 400, error: 'คำสั่งไม่ถูกต้อง' }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test lib/auth/policy.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/auth/policy.ts lib/auth/policy.test.ts
git commit -m "feat: Add dashboard account rules (validation, redirects, admin actions)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: `dashboard.accounts` data layer

**Files:**
- Modify: `lib/db/supabase-rest.ts` (export config/headers, per-call `schema`, move `likePattern` here)
- Modify: `lib/db/admin-queries.ts` (import `likePattern` instead of defining it)
- Create: `lib/auth/accounts.ts`
- Create: `tests/fixtures.ts`
- Test: `lib/auth/accounts.test.ts`

**Interfaces:**
- Consumes: `EMAIL_COOLDOWN_MS`, `ACCOUNT_STATUSES`, `Role`, `AccountStatus` from Task 2; `ListParams`, `Page` from `lib/db/types.ts`.
- Produces:
  - In `supabase-rest.ts`: `supabaseConfig(): { url: string; key: string; schema: string }`, `authHeaders(key: string): Record<string, string>`, `likePattern(value: string): string`, `SelectOptions.schema?: string`, `sbUpdate(table, filters, patch, opts?: { schema?: string })`
  - In `accounts.ts`:
    - `DASHBOARD_SCHEMA = 'dashboard'`
    - `interface AccountRow { id: string; email: string; full_name: string; role: Role; status: AccountStatus; is_root: boolean; email_verified_at: string | null; approved_at: string | null; approved_by: string | null; sessions_valid_after: string; last_email_sent_at: string | null; created_at: string; updated_at: string }`
    - `type AccountListItem = Pick<AccountRow, 'id' | 'email' | 'full_name' | 'role' | 'status' | 'is_root' | 'created_at' | 'approved_at' | 'email_verified_at'>`
    - `isUuid(v: string): boolean`
    - `getAccountById(id: string): Promise<AccountRow | null>`
    - `getAccountByEmail(email: string): Promise<AccountRow | null>` (normalizes)
    - `getRootAccount(): Promise<AccountRow | null>`
    - `updateAccounts(filters: Record<string, string>, patch: Record<string, unknown>): Promise<AccountRow[]>`
    - `claimEmailSlot(id: string, now?: number): Promise<boolean>`
    - `listAccounts(p: ListParams): Promise<Page<AccountListItem>>`
  - In `tests/fixtures.ts`: `ORIGIN`, `SECRET`, `USER_ID`, `ADMIN_ID`, `ROOT_ID`, `accountRow(over?)`, `stubAuthEnv()`, `sessionCookie(id, iat?)`, `request(path, init?)`

- [ ] **Step 1: Write `tests/fixtures.ts`** (shared by all later tests)

```ts
import { NextRequest } from 'next/server'
import { vi } from 'vitest'
import type { AccountRow } from '@/lib/auth/accounts'
import { signToken } from '@/lib/auth/tokens'

export const ORIGIN = 'http://localhost:3000'
export const SECRET = 's'.repeat(40)
export const USER_ID = '11111111-1111-4111-8111-111111111111'
export const ADMIN_ID = '22222222-2222-4222-8222-222222222222'
export const ROOT_ID = '33333333-3333-4333-8333-333333333333'

export function accountRow(over: Partial<AccountRow> = {}): AccountRow {
  return {
    id: USER_ID,
    email: 'somchai@example.com',
    full_name: 'สมชาย ใจดี',
    role: 'user',
    status: 'active',
    is_root: false,
    email_verified_at: '2026-01-01T00:00:00+00:00',
    approved_at: '2026-01-02T00:00:00+00:00',
    approved_by: ROOT_ID,
    sessions_valid_after: '2026-01-01T00:00:00.123456+00:00',
    last_email_sent_at: null,
    created_at: '2026-01-01T00:00:00+00:00',
    updated_at: '2026-01-01T00:00:00+00:00',
    ...over,
  }
}

export function stubAuthEnv() {
  vi.stubEnv('SUPABASE_URL', 'https://sb.test')
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'sb_secret_test')
  vi.stubEnv('DASHBOARD_SESSION_SECRET', SECRET)
  vi.stubEnv('APP_BASE_URL', ORIGIN)
}

/** ค่า header cookie ของเซสชันที่ถูกต้อง */
export function sessionCookie(id: string, iat = Date.now()) {
  return `dash_session=${signToken(SECRET, 'session', { sub: id, iat, exp: iat + 3_600_000 })}`
}

export function request(
  path: string,
  init: { method?: string; body?: unknown; origin?: string | null; cookie?: string } = {},
): NextRequest {
  const headers = new Headers()
  if (init.body !== undefined) headers.set('content-type', 'application/json')
  if (init.origin !== null) headers.set('origin', init.origin ?? ORIGIN)
  if (init.cookie) headers.set('cookie', init.cookie)
  return new NextRequest(`${ORIGIN}${path}`, {
    method: init.method ?? (init.body === undefined ? 'GET' : 'POST'),
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  })
}
```

- [ ] **Step 2: Write the failing tests** — `lib/auth/accounts.test.ts`

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { stubAuthEnv, USER_ID } from '@/tests/fixtures'
import { claimEmailSlot, getAccountByEmail, getAccountById, listAccounts } from './accounts'

const fetchMock = vi.fn()

const reply = (rows: unknown[], total = rows.length) =>
  new Response(JSON.stringify(rows), { status: 200, headers: { 'content-range': `0-${Math.max(0, rows.length - 1)}/${total}` } })

const call = (i = 0) => {
  const [url, init] = fetchMock.mock.calls[i] as [string, RequestInit]
  return { url: new URL(url), init, headers: new Headers(init.headers) }
}

beforeEach(() => {
  stubAuthEnv()
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('dashboard.accounts reads', () => {
  it('returns null for a non-uuid id without calling Supabase', async () => {
    expect(await getAccountById('not-a-uuid')).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('reads by id from the dashboard schema', async () => {
    fetchMock.mockResolvedValue(reply([{ id: USER_ID }]))
    expect(await getAccountById(USER_ID)).toEqual({ id: USER_ID })
    const { url, headers } = call()
    expect(url.pathname).toBe('/rest/v1/accounts')
    expect(url.searchParams.get('id')).toBe(`eq.${USER_ID}`)
    expect(headers.get('Accept-Profile')).toBe('dashboard')
  })

  it('normalizes the email before looking it up', async () => {
    fetchMock.mockResolvedValue(reply([]))
    expect(await getAccountByEmail('  Somchai@Example.COM ')).toBeNull()
    expect(call().url.searchParams.get('email')).toBe('eq.somchai@example.com')
  })
})

describe('claimEmailSlot', () => {
  const NOW = Date.parse('2026-10-08T03:00:00.000Z')

  it('claims only when the last email is older than 60 s, in one conditional update', async () => {
    fetchMock.mockResolvedValue(reply([{ id: USER_ID }]))
    expect(await claimEmailSlot(USER_ID, NOW)).toBe(true)
    const { url, init, headers } = call()
    expect(init.method).toBe('PATCH')
    expect(headers.get('Content-Profile')).toBe('dashboard')
    expect(url.searchParams.get('id')).toBe(`eq.${USER_ID}`)
    expect(url.searchParams.get('or')).toBe('(last_email_sent_at.is.null,last_email_sent_at.lt.2026-10-08T02:59:00.000Z)')
    expect(JSON.parse(String(init.body))).toEqual({ last_email_sent_at: '2026-10-08T03:00:00.000Z' })
  })

  it('returns false when the update matched no row (still cooling down)', async () => {
    fetchMock.mockResolvedValue(reply([]))
    expect(await claimEmailSlot(USER_ID, NOW)).toBe(false)
  })
})

describe('listAccounts', () => {
  it('filters by a known status and searches name/email', async () => {
    fetchMock.mockResolvedValue(reply([], 0))
    await listAccounts({ page: 2, pageSize: 10, status: 'pending', q: 'som(chai)' })
    const { url } = call()
    expect(url.searchParams.get('status')).toBe('eq.pending')
    expect(url.searchParams.get('or')).toBe('(full_name.ilike."*som chai*",email.ilike."*som chai*")')
    expect(url.searchParams.get('offset')).toBe('10')
    expect(url.searchParams.get('limit')).toBe('10')
  })

  it('ignores an unknown status', async () => {
    fetchMock.mockResolvedValue(reply([], 0))
    await listAccounts({ page: 1, pageSize: 10, status: 'banana' })
    expect(call().url.searchParams.has('status')).toBe(false)
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm test lib/auth/accounts.test.ts`
Expected: FAIL — `Failed to resolve import "./accounts"`.

- [ ] **Step 4: Extend `lib/db/supabase-rest.ts`**

Apply these edits:

1. Change `function authHeaders(key: string)` to `export function authHeaders(key: string)`.
2. Rename `function config()` to `export function supabaseConfig()` and update its two callers in `sbSelect` and `sbUpdate` (`const { url, key, schema } = supabaseConfig()`).
3. Below `quoteFilterValue`, add (moved from `admin-queries.ts`):

```ts
/** ค้นหาแบบ ilike (ตัด wildcard ที่ผู้ใช้พิมพ์มาเพื่อไม่ให้เปลี่ยนความหมายของ pattern) */
export function likePattern(value: string): string {
  return `*${value.replace(/[*%,()]/g, ' ').trim()}*`
}
```

4. In `SelectOptions` add, after `offset?: number`:

```ts
  /** schema อื่นนอกจากค่าเริ่มต้น (เช่น 'dashboard') */
  schema?: string
```

5. In `sbSelect`, change `'Accept-Profile': schema,` to `'Accept-Profile': opts.schema ?? schema,`.
6. Change the `sbUpdate` signature and header:

```ts
export async function sbUpdate<T>(
  table: string,
  filters: Record<string, string>,
  patch: Record<string, unknown>,
  opts: { schema?: string } = {},
): Promise<T[]> {
  const { url, key, schema } = supabaseConfig()
```

and `'Content-Profile': schema,` → `'Content-Profile': opts.schema ?? schema,`.

- [ ] **Step 5: Point `lib/db/admin-queries.ts` at the moved helper**

Delete the local `likePattern` function (the 4 lines starting `/** ค้นหาแบบ ilike`) and add `likePattern` to the existing import:

```ts
import { isSupabaseConfigured, likePattern, quoteFilterValue, sbSelect, sbSelectAll, sbUpdate } from './supabase-rest'
```

- [ ] **Step 6: Create `lib/auth/accounts.ts`**

```ts
/**
 * ตาราง dashboard.accounts — บทบาท/สถานะของบัญชีแดชบอร์ด (Supabase Auth เก็บแค่อีเมล+รหัสผ่าน)
 * ใช้ได้เฉพาะฝั่งเซิร์ฟเวอร์ ไม่แตะ schema `app` ของแอปจัดการขยะ
 */

import { likePattern, quoteFilterValue, sbSelect, sbUpdate } from '@/lib/db/supabase-rest'
import type { ListParams, Page } from '@/lib/db/types'
import { ACCOUNT_STATUSES, EMAIL_COOLDOWN_MS, normalizeEmail, type AccountStatus, type Role } from './policy'

export const DASHBOARD_SCHEMA = 'dashboard'
const TABLE = 'accounts'

export interface AccountRow {
  id: string
  email: string
  full_name: string
  role: Role
  status: AccountStatus
  is_root: boolean
  email_verified_at: string | null
  approved_at: string | null
  approved_by: string | null
  sessions_valid_after: string
  last_email_sent_at: string | null
  created_at: string
  updated_at: string
}

export type AccountListItem = Pick<
  AccountRow,
  'id' | 'email' | 'full_name' | 'role' | 'status' | 'is_root' | 'created_at' | 'approved_at' | 'email_verified_at'
>

const LIST_COLUMNS = 'id,email,full_name,role,status,is_root,created_at,approved_at,email_verified_at'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const isUuid = (v: string) => UUID_RE.test(v)

async function findOne(filters: Record<string, string>): Promise<AccountRow | null> {
  const { rows } = await sbSelect<AccountRow>(TABLE, { schema: DASHBOARD_SCHEMA, filters, limit: 1 })
  return rows[0] ?? null
}

export async function getAccountById(id: string): Promise<AccountRow | null> {
  return isUuid(id) ? findOne({ id: `eq.${id}` }) : null
}

export function getAccountByEmail(email: string): Promise<AccountRow | null> {
  return findOne({ email: `eq.${normalizeEmail(email)}` })
}

export function getRootAccount(): Promise<AccountRow | null> {
  return findOne({ is_root: 'is.true' })
}

/** อัปเดตแบบมีเงื่อนไข — คืนแถวที่ถูกอัปเดต (ว่าง = เงื่อนไขไม่ตรง เช่นสถานะเปลี่ยนไปแล้ว) */
export function updateAccounts(filters: Record<string, string>, patch: Record<string, unknown>): Promise<AccountRow[]> {
  return sbUpdate<AccountRow>(TABLE, filters, patch, { schema: DASHBOARD_SCHEMA })
}

/** จองสิทธิ์ส่งอีเมล 1 ฉบับต่อ 60 วินาทีต่อบัญชี (อัปเดตแบบมีเงื่อนไขครั้งเดียว กันกดรัว) */
export async function claimEmailSlot(id: string, now = Date.now()): Promise<boolean> {
  const cutoff = new Date(now - EMAIL_COOLDOWN_MS).toISOString()
  const rows = await updateAccounts(
    { id: `eq.${id}`, or: `(last_email_sent_at.is.null,last_email_sent_at.lt.${cutoff})` },
    { last_email_sent_at: new Date(now).toISOString() },
  )
  return rows.length > 0
}

export function listAccounts(p: ListParams): Promise<Page<AccountListItem>> {
  const filters: Record<string, string> = { order: 'created_at.desc,id.asc' }
  if (p.status && (ACCOUNT_STATUSES as readonly string[]).includes(p.status)) filters.status = `eq.${p.status}`
  if (p.q) {
    const pattern = quoteFilterValue(likePattern(p.q))
    filters.or = `(full_name.ilike.${pattern},email.ilike.${pattern})`
  }
  return sbSelect<AccountListItem>(TABLE, {
    schema: DASHBOARD_SCHEMA,
    select: LIST_COLUMNS,
    filters,
    limit: p.pageSize,
    offset: (p.page - 1) * p.pageSize,
  })
}
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `pnpm test`
Expected: PASS (tokens, policy, accounts).

- [ ] **Step 8: Commit**

```bash
git add lib/db/supabase-rest.ts lib/db/admin-queries.ts lib/auth/accounts.ts lib/auth/accounts.test.ts tests/fixtures.ts
git commit -m "feat: Add dashboard.accounts data layer

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Supabase Auth REST client

**Files:**
- Create: `lib/auth/supabase-auth.ts`
- Test: `lib/auth/supabase-auth.test.ts`

**Interfaces:**
- Consumes: `supabaseConfig()`, `authHeaders()` from Task 3.
- Produces:
  - `class AuthApiError extends Error { status: number }`
  - `verifyPassword(email: string, password: string): Promise<string | null>` — user id when correct, `null` when wrong, throws `AuthApiError` otherwise (429 included)
  - `createAuthUser(input: { email: string; password: string; fullName: string }): Promise<string>` — new user id; throws `AuthApiError` (422 = email exists)
  - `updateAuthUserPassword(id: string, password: string): Promise<void>`
  - `deleteAuthUser(id: string): Promise<void>`

- [ ] **Step 1: Write the failing tests** — `lib/auth/supabase-auth.test.ts`

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { stubAuthEnv, USER_ID } from '@/tests/fixtures'
import { AuthApiError, createAuthUser, deleteAuthUser, updateAuthUserPassword, verifyPassword } from './supabase-auth'

const fetchMock = vi.fn()
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })
const call = (i = 0) => {
  const [url, init] = fetchMock.mock.calls[i] as [string, RequestInit]
  return { url: new URL(url), init, body: init.body ? JSON.parse(String(init.body)) : undefined, headers: new Headers(init.headers) }
}

beforeEach(() => {
  stubAuthEnv()
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('verifyPassword', () => {
  it('returns the user id for correct credentials and discards Supabase tokens', async () => {
    fetchMock.mockResolvedValue(json({ access_token: 'x', user: { id: USER_ID } }))
    expect(await verifyPassword('a@b.co', 'pw')).toBe(USER_ID)
    const { url, body, headers, init } = call()
    expect(url.pathname).toBe('/auth/v1/token')
    expect(url.searchParams.get('grant_type')).toBe('password')
    expect(init.method).toBe('POST')
    expect(body).toEqual({ email: 'a@b.co', password: 'pw' })
    expect(headers.get('apikey')).toBe('sb_secret_test')
  })

  it('returns null for wrong credentials (400)', async () => {
    fetchMock.mockResolvedValue(json({ code: 'invalid_credentials' }, 400))
    expect(await verifyPassword('a@b.co', 'bad')).toBeNull()
  })

  it('throws AuthApiError with status 429 when rate limited', async () => {
    fetchMock.mockResolvedValue(json({ code: 'over_request_rate_limit' }, 429))
    await expect(verifyPassword('a@b.co', 'pw')).rejects.toMatchObject({ name: 'AuthApiError', status: 429 })
  })
})

describe('admin user API', () => {
  it('creates a confirmed user tagged as a dashboard account', async () => {
    fetchMock.mockResolvedValue(json({ id: USER_ID }))
    expect(await createAuthUser({ email: 'a@b.co', password: 'password1', fullName: 'สมชาย' })).toBe(USER_ID)
    const { url, body, init } = call()
    expect(url.pathname).toBe('/auth/v1/admin/users')
    expect(init.method).toBe('POST')
    expect(body).toEqual({
      email: 'a@b.co',
      password: 'password1',
      email_confirm: true,
      app_metadata: { source: 'dashboard' },
      user_metadata: { full_name: 'สมชาย' },
    })
  })

  it('surfaces "email exists" as AuthApiError 422', async () => {
    fetchMock.mockResolvedValue(json({ code: 'email_exists' }, 422))
    const err = await createAuthUser({ email: 'a@b.co', password: 'password1', fullName: 'x' }).catch((e) => e)
    expect(err).toBeInstanceOf(AuthApiError)
    expect(err.status).toBe(422)
  })

  it('updates a password and deletes a user by id', async () => {
    fetchMock.mockResolvedValueOnce(json({ id: USER_ID })).mockResolvedValueOnce(new Response(null, { status: 200 }))
    await updateAuthUserPassword(USER_ID, 'newpassword')
    await deleteAuthUser(USER_ID)
    expect(call(0).url.pathname).toBe(`/auth/v1/admin/users/${USER_ID}`)
    expect(call(0).init.method).toBe('PUT')
    expect(call(0).body).toEqual({ password: 'newpassword' })
    expect(call(1).url.pathname).toBe(`/auth/v1/admin/users/${USER_ID}`)
    expect(call(1).init.method).toBe('DELETE')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test lib/auth/supabase-auth.test.ts`
Expected: FAIL — `Failed to resolve import "./supabase-auth"`.

- [ ] **Step 3: Create `lib/auth/supabase-auth.ts`**

```ts
/**
 * Supabase Auth (GoTrue) ผ่าน REST — ไม่ใช้ SDK, ใช้ service-role key ฝั่งเซิร์ฟเวอร์เท่านั้น
 * Supabase Auth เก็บแค่อีเมล+รหัสผ่าน; บทบาท/สถานะอยู่ใน dashboard.accounts (ดู ./accounts)
 */

import { authHeaders, supabaseConfig } from '@/lib/db/supabase-rest'

export class AuthApiError extends Error {
  name = 'AuthApiError'
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

async function authFetch(path: string, method: string, body?: unknown): Promise<Response> {
  const { url, key } = supabaseConfig()
  return fetch(`${url}/auth/v1${path}`, {
    method,
    headers: { ...authHeaders(key), 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
  })
}

async function ensureOk(res: Response, what: string): Promise<Response> {
  if (!res.ok) throw new AuthApiError(res.status, `Supabase Auth ${what}: ${res.status} ${await res.text()}`)
  return res
}

/** ตรวจรหัสผ่าน — คืน user id เมื่อถูกต้อง, null เมื่อผิด (token ที่ Supabase ออกให้ถูกทิ้ง เราออก cookie เอง) */
export async function verifyPassword(email: string, password: string): Promise<string | null> {
  const res = await authFetch('/token?grant_type=password', 'POST', { email, password })
  if (res.status === 400 || res.status === 401) return null
  await ensureOk(res, 'password grant')
  const json = (await res.json()) as { user?: { id?: string } }
  return json.user?.id ?? null
}

/**
 * สร้างผู้ใช้ — trigger dashboard_on_auth_user_created สร้างแถว dashboard.accounts ใน transaction เดียวกัน
 * email_confirm: true เพราะเรายืนยันอีเมลเอง (สถานะ unverified → pending ใน dashboard.accounts)
 */
export async function createAuthUser(input: { email: string; password: string; fullName: string }): Promise<string> {
  const res = await ensureOk(
    await authFetch('/admin/users', 'POST', {
      email: input.email,
      password: input.password,
      email_confirm: true,
      app_metadata: { source: 'dashboard' },
      user_metadata: { full_name: input.fullName },
    }),
    'create user',
  )
  return ((await res.json()) as { id: string }).id
}

export async function updateAuthUserPassword(id: string, password: string): Promise<void> {
  await ensureOk(await authFetch(`/admin/users/${id}`, 'PUT', { password }), 'update password')
}

/** ลบผู้ใช้ → แถวใน dashboard.accounts ถูกลบตาม (on delete cascade) */
export async function deleteAuthUser(id: string): Promise<void> {
  await ensureOk(await authFetch(`/admin/users/${id}`, 'DELETE'), 'delete user')
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test lib/auth/supabase-auth.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/auth/supabase-auth.ts lib/auth/supabase-auth.test.ts
git commit -m "feat: Add Supabase Auth REST client for dashboard accounts

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Email (Gmail SMTP, templates, mailers)

**Files:**
- Modify: `package.json` (add `nodemailer`, `@types/nodemailer`)
- Create: `lib/email-templates.ts`
- Create: `lib/email.ts`
- Create: `lib/auth/mailers.ts`
- Test: `lib/email-templates.test.ts`, `lib/auth/mailers.test.ts`

**Interfaces:**
- Consumes: `sessionSecret`, `appBaseUrl` (Task 1); `signToken`; `claimEmailSlot`, `getRootAccount`, `AccountRow` (Task 3); `ROLE_LABELS`, `VERIFY_EMAIL_TTL_MS`, `RESET_PASSWORD_TTL_MS`, `Role` (Task 2).
- Produces:
  - `interface MailMessage { to: string; subject: string; text: string; html: string }`
  - `verifyEmailMail(to, name, url)`, `newSignupMail(to, applicant: { name: string; email: string }, url)`, `approvedMail(to, name, role: Role, url)`, `rejectedMail(to, name)`, `resetPasswordMail(to, name, url)` — all return `MailMessage`
  - `sendMail(msg: MailMessage): Promise<boolean>` (never throws)
  - `sendVerificationEmail(account: AccountRow, now?: number): Promise<boolean>`
  - `sendPasswordResetEmail(account: AccountRow, now?: number): Promise<boolean>`
  - `notifyRootOfSignup(account: AccountRow): Promise<boolean>`
  - `sendDecisionEmail(account: AccountRow, decision: 'approved' | 'rejected'): Promise<boolean>`

- [ ] **Step 1: Install nodemailer**

Run: `pnpm add nodemailer && pnpm add -D @types/nodemailer`

- [ ] **Step 2: Write the failing template tests** — `lib/email-templates.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { approvedMail, newSignupMail, rejectedMail, resetPasswordMail, verifyEmailMail } from './email-templates'

describe('email templates', () => {
  it('puts the link in both the text and the HTML body', () => {
    const m = verifyEmailMail('a@b.co', 'สมชาย', 'https://dash.example/verify-email?token=abc')
    expect(m.to).toBe('a@b.co')
    expect(m.text).toContain('https://dash.example/verify-email?token=abc')
    expect(m.html).toContain('href="https://dash.example/verify-email?token=abc"')
    expect(m.text).toContain('สมชาย')
  })

  it('escapes HTML in names', () => {
    const m = newSignupMail('root@b.co', { name: '<script>x</script>', email: 'a@b.co' }, 'https://dash.example/admin/accounts')
    expect(m.html).not.toContain('<script>')
    expect(m.html).toContain('&lt;script&gt;')
  })

  it('says which role was approved', () => {
    expect(approvedMail('a@b.co', 'สมชาย', 'admin', 'https://dash.example/login').text).toContain('แอดมิน')
    expect(approvedMail('a@b.co', 'สมชาย', 'user', 'https://dash.example/login').text).toContain('ผู้ใช้')
  })

  it('has a subject on every message', () => {
    const all = [
      verifyEmailMail('a@b.co', 'x', 'u'),
      newSignupMail('a@b.co', { name: 'x', email: 'y' }, 'u'),
      approvedMail('a@b.co', 'x', 'user', 'u'),
      rejectedMail('a@b.co', 'x'),
      resetPasswordMail('a@b.co', 'x', 'u'),
    ]
    for (const m of all) expect(m.subject.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 3: Write the failing mailer tests** — `lib/auth/mailers.test.ts`

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { sendMail } from '@/lib/email'
import { accountRow, ORIGIN, ROOT_ID, SECRET, stubAuthEnv } from '@/tests/fixtures'
import { claimEmailSlot, getRootAccount } from './accounts'
import { notifyRootOfSignup, sendDecisionEmail, sendPasswordResetEmail, sendVerificationEmail } from './mailers'
import { verifyToken } from './tokens'

vi.mock('@/lib/email', () => ({ sendMail: vi.fn() }))
vi.mock('./accounts', () => ({ claimEmailSlot: vi.fn(), getRootAccount: vi.fn() }))

const NOW = Date.parse('2026-10-08T03:00:00.000Z')
const sent = () => vi.mocked(sendMail).mock.calls.map(([m]) => m)
const tokenIn = (text: string) => decodeURIComponent(/token=([^\s&]+)/.exec(text)![1])

beforeEach(() => {
  stubAuthEnv()
  vi.mocked(sendMail).mockReset().mockResolvedValue(true)
  vi.mocked(claimEmailSlot).mockReset().mockResolvedValue(true)
  vi.mocked(getRootAccount).mockReset()
})
afterEach(() => vi.unstubAllEnvs())

describe('sendVerificationEmail', () => {
  it('emails a 24 h verify-email link to the account', async () => {
    const account = accountRow({ status: 'unverified' })
    expect(await sendVerificationEmail(account, NOW)).toBe(true)
    const [m] = sent()
    expect(m.to).toBe(account.email)
    expect(m.text).toContain(`${ORIGIN}/verify-email?token=`)
    const claims = verifyToken(SECRET, 'verify-email', tokenIn(m.text), NOW)
    expect(claims).toMatchObject({ sub: account.id, exp: NOW + 24 * 60 * 60 * 1000 })
  })

  it('sends nothing while cooling down', async () => {
    vi.mocked(claimEmailSlot).mockResolvedValue(false)
    expect(await sendVerificationEmail(accountRow(), NOW)).toBe(false)
    expect(sendMail).not.toHaveBeenCalled()
  })

  it('sends nothing on production without APP_BASE_URL', async () => {
    vi.stubEnv('APP_BASE_URL', '')
    vi.stubEnv('NODE_ENV', 'production')
    expect(await sendVerificationEmail(accountRow(), NOW)).toBe(false)
    expect(sendMail).not.toHaveBeenCalled()
  })
})

describe('sendPasswordResetEmail', () => {
  it('ties the 1 h reset link to the current sessions_valid_after', async () => {
    const account = accountRow()
    expect(await sendPasswordResetEmail(account, NOW)).toBe(true)
    const claims = verifyToken(SECRET, 'reset-password', tokenIn(sent()[0].text), NOW)
    expect(claims).toMatchObject({ sub: account.id, sva: Date.parse(account.sessions_valid_after), exp: NOW + 60 * 60 * 1000 })
  })
})

describe('notifyRootOfSignup', () => {
  it('emails only the root admin, linking to the pending list', async () => {
    vi.mocked(getRootAccount).mockResolvedValue(accountRow({ id: ROOT_ID, email: 'root@example.com', role: 'admin', is_root: true }))
    expect(await notifyRootOfSignup(accountRow({ status: 'pending', email: 'new@example.com' }))).toBe(true)
    const [m] = sent()
    expect(m.to).toBe('root@example.com')
    expect(m.text).toContain('new@example.com')
    expect(m.text).toContain(`${ORIGIN}/admin/accounts?status=pending`)
  })

  it('returns false when there is no root admin yet', async () => {
    vi.mocked(getRootAccount).mockResolvedValue(null)
    expect(await notifyRootOfSignup(accountRow())).toBe(false)
    expect(sendMail).not.toHaveBeenCalled()
  })
})

describe('sendDecisionEmail', () => {
  it('sends approval with a login link, and rejection without one', async () => {
    await sendDecisionEmail(accountRow({ role: 'admin' }), 'approved')
    await sendDecisionEmail(accountRow(), 'rejected')
    const [approved, rejected] = sent()
    expect(approved.text).toContain(`${ORIGIN}/login`)
    expect(rejected.text).not.toContain('http')
  })
})
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `pnpm test lib/email-templates.test.ts lib/auth/mailers.test.ts`
Expected: FAIL — cannot resolve `./email-templates`, `@/lib/email`, `./mailers`.

- [ ] **Step 5: Create `lib/email-templates.ts`**

```ts
/** เนื้อหาอีเมลของระบบบัญชีแดชบอร์ด (ฟังก์ชันล้วน) */

import { ROLE_LABELS, type Role } from '@/lib/auth/policy'

export interface MailMessage {
  to: string
  subject: string
  text: string
  html: string
}

const HTML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c])

function compose(to: string, subject: string, paragraphs: string[], link?: { url: string; label: string }): MailMessage {
  const text = [...paragraphs, ...(link ? [`${link.label}: ${link.url}`] : [])].join('\n\n')
  const html = [
    ...paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`),
    ...(link ? [`<p><a href="${escapeHtml(link.url)}">${escapeHtml(link.label)}</a></p>`] : []),
  ].join('\n')
  return { to, subject, text, html }
}

const SIGNATURE = 'ระบบข้อมูลร่วมอนุรักษ์โลก คุ้งบางกะเจ้า'

export const verifyEmailMail = (to: string, name: string, url: string) =>
  compose(
    to,
    'ยืนยันอีเมลสำหรับบัญชีแดชบอร์ด',
    [
      `สวัสดีคุณ ${name}`,
      'กรุณายืนยันอีเมลเพื่อส่งคำขอเปิดบัญชีให้ผู้ดูแลระบบพิจารณา ลิงก์นี้ใช้ได้ภายใน 24 ชั่วโมง',
      'หากคุณไม่ได้สมัครใช้งาน ไม่ต้องทำอะไร',
      SIGNATURE,
    ],
    { url, label: 'ยืนยันอีเมล' },
  )

export const newSignupMail = (to: string, applicant: { name: string; email: string }, url: string) =>
  compose(
    to,
    `คำขอเปิดบัญชีแดชบอร์ดใหม่: ${applicant.email}`,
    [`มีผู้สมัครใช้งานแดชบอร์ดและยืนยันอีเมลแล้ว`, `ชื่อ: ${applicant.name}`, `อีเมล: ${applicant.email}`, SIGNATURE],
    { url, label: 'ดูคำขอที่รออนุมัติ' },
  )

export const approvedMail = (to: string, name: string, role: Role, url: string) =>
  compose(
    to,
    'บัญชีแดชบอร์ดของคุณได้รับการอนุมัติแล้ว',
    [`สวัสดีคุณ ${name}`, `บัญชีของคุณได้รับการอนุมัติในบทบาท "${ROLE_LABELS[role]}" แล้ว เข้าสู่ระบบได้ทันที`, SIGNATURE],
    { url, label: 'เข้าสู่ระบบ' },
  )

export const rejectedMail = (to: string, name: string) =>
  compose(to, 'ผลการพิจารณาคำขอบัญชีแดชบอร์ด', [
    `สวัสดีคุณ ${name}`,
    'คำขอเปิดบัญชีแดชบอร์ดของคุณไม่ได้รับการอนุมัติ หากคิดว่าเป็นความผิดพลาด กรุณาติดต่อผู้ดูแลระบบ',
    SIGNATURE,
  ])

export const resetPasswordMail = (to: string, name: string, url: string) =>
  compose(
    to,
    'ตั้งรหัสผ่านใหม่สำหรับบัญชีแดชบอร์ด',
    [
      `สวัสดีคุณ ${name}`,
      'มีคำขอตั้งรหัสผ่านใหม่สำหรับบัญชีของคุณ ลิงก์นี้ใช้ได้ภายใน 1 ชั่วโมงและใช้ได้ครั้งเดียว',
      'หากคุณไม่ได้ขอ ไม่ต้องทำอะไร รหัสผ่านเดิมยังใช้ได้',
      SIGNATURE,
    ],
    { url, label: 'ตั้งรหัสผ่านใหม่' },
  )
```

- [ ] **Step 6: Create `lib/email.ts`**

```ts
/**
 * ส่งอีเมลผ่าน Gmail SMTP — ตั้ง GMAIL_USER + GMAIL_APP_PASSWORD (App password ของ Google,
 * ต้องเปิด 2-Step Verification ของบัญชี Gmail ก่อน)
 */

import nodemailer, { type Transporter } from 'nodemailer'
import { readEnv } from '@/lib/google-sheets'
import type { MailMessage } from '@/lib/email-templates'

let transporter: Transporter | null = null

/** false = ไม่ได้ส่ง (ยังไม่ได้ตั้งค่า หรือส่งไม่สำเร็จ) — ไม่ throw เพื่อไม่ให้การกระทำหลักล้มตาม */
export async function sendMail(msg: MailMessage): Promise<boolean> {
  const user = readEnv('GMAIL_USER')
  const pass = readEnv('GMAIL_APP_PASSWORD')
  if (!user || !pass) {
    console.error('[email] GMAIL_USER / GMAIL_APP_PASSWORD ยังไม่ได้ตั้งค่า — ไม่ได้ส่ง:', msg.subject)
    return false
  }
  transporter ??= nodemailer.createTransport({ service: 'gmail', auth: { user, pass } })
  try {
    await transporter.sendMail({ from: { name: 'Digital Waste Dashboard', address: user }, ...msg })
    return true
  } catch (err) {
    console.error('[email] ส่งไม่สำเร็จ:', msg.subject, err)
    return false
  }
}
```

- [ ] **Step 7: Create `lib/auth/mailers.ts`**

```ts
/** อีเมลแต่ละแบบของระบบบัญชี: สร้างลิงก์ + token, เช็ก cooldown แล้วส่ง */

import { sendMail } from '@/lib/email'
import { approvedMail, newSignupMail, rejectedMail, resetPasswordMail, verifyEmailMail } from '@/lib/email-templates'
import { claimEmailSlot, getRootAccount, type AccountRow } from './accounts'
import { appBaseUrl, sessionSecret } from './config'
import { RESET_PASSWORD_TTL_MS, VERIFY_EMAIL_TTL_MS } from './policy'
import { signToken, type TokenClaims, type TokenPurpose } from './tokens'

function link(path: string): string | null {
  const base = appBaseUrl()
  if (!base) console.error('[mailers] APP_BASE_URL ยังไม่ได้ตั้งค่า — สร้างลิงก์ในอีเมลไม่ได้')
  return base ? `${base}${path}` : null
}

function tokenLink(page: string, purpose: TokenPurpose, claims: TokenClaims): string | null {
  const secret = sessionSecret()
  return secret ? link(`${page}?token=${encodeURIComponent(signToken(secret, purpose, claims))}`) : null
}

/** false = ไม่ได้ส่ง (ติด cooldown 60 วินาที, ตั้งค่าไม่ครบ หรือส่งไม่สำเร็จ) */
export async function sendVerificationEmail(account: AccountRow, now = Date.now()): Promise<boolean> {
  const url = tokenLink('/verify-email', 'verify-email', { sub: account.id, exp: now + VERIFY_EMAIL_TTL_MS })
  if (!url || !(await claimEmailSlot(account.id, now))) return false
  return sendMail(verifyEmailMail(account.email, account.full_name, url))
}

/** ลิงก์ผูกกับ sessions_valid_after ปัจจุบัน — ตั้งรหัสใหม่แล้วค่านี้เปลี่ยน ลิงก์เดิมจึงใช้ซ้ำไม่ได้ */
export async function sendPasswordResetEmail(account: AccountRow, now = Date.now()): Promise<boolean> {
  const url = tokenLink('/reset-password', 'reset-password', {
    sub: account.id,
    sva: Date.parse(account.sessions_valid_after),
    exp: now + RESET_PASSWORD_TTL_MS,
  })
  if (!url || !(await claimEmailSlot(account.id, now))) return false
  return sendMail(resetPasswordMail(account.email, account.full_name, url))
}

/** แจ้ง root admin คนเดียวเมื่อมีผู้สมัครยืนยันอีเมลแล้ว */
export async function notifyRootOfSignup(account: AccountRow): Promise<boolean> {
  const [root, url] = [await getRootAccount(), link('/admin/accounts?status=pending')]
  if (!root || !url) {
    console.error('[mailers] ยังไม่มี root admin หรือ APP_BASE_URL — ไม่ได้แจ้งคำขอใหม่', account.email)
    return false
  }
  return sendMail(newSignupMail(root.email, { name: account.full_name, email: account.email }, url))
}

export async function sendDecisionEmail(account: AccountRow, decision: 'approved' | 'rejected'): Promise<boolean> {
  if (decision === 'rejected') return sendMail(rejectedMail(account.email, account.full_name))
  const url = link('/login')
  return url ? sendMail(approvedMail(account.email, account.full_name, account.role, url)) : false
}
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `pnpm test`
Expected: PASS (all suites so far).

- [ ] **Step 9: Commit**

```bash
git add package.json pnpm-lock.yaml lib/email.ts lib/email-templates.ts lib/email-templates.test.ts lib/auth/mailers.ts lib/auth/mailers.test.ts
git commit -m "feat: Add Gmail SMTP mailer and account emails

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Session cookie, guards and route wrappers

**Files:**
- Create: `lib/auth/session.ts`
- Create: `lib/auth/http.ts`
- Modify: `lib/db/route-helpers.ts` (async guards using the new session)
- Modify: `app/api/waste-dashboard/route.ts`, `app/api/waste/dashboard/route.ts` (require sign-in)
- Test: `lib/auth/session.test.ts`, `lib/auth/http.test.ts`

**Interfaces:**
- Consumes: `getAccountById`, `AccountRow` (Task 3); `sessionSecret`, `authConfigured`, `appBaseUrl` (Task 1); `signToken`, `verifyToken`; `Role`.
- Produces:
  - session.ts: `SESSION_COOKIE = 'dash_session'`, `SESSION_MAX_AGE_SECONDS = 43200`, `interface SessionAccount { id: string; email: string; fullName: string; role: Role; isRoot: boolean }`, `setSessionCookie(res: NextResponse, accountId: string, now?: number): void`, `clearSessionCookie(res: NextResponse): void`, `getSessionAccount(req: NextRequest, now?: number): Promise<SessionAccount | null>`
  - http.ts: `NO_STORE`, `FOREIGN_ORIGIN_MESSAGE`, `ok(data?: Record<string, unknown>): NextResponse`, `jsonError(error: string, status: number, extra?: Record<string, unknown>): NextResponse`, `isSameOrigin(req: NextRequest): boolean`, `readBody(req: NextRequest): Promise<Record<string, unknown>>`, `field(body: Record<string, unknown>, key: string): string`, `type Need = 'signed-in' | 'admin'`, `requireAccount(req, need): Promise<{ account: SessionAccount } | { denied: NextResponse }>`, `publicAuthRoute(fn: (req: NextRequest) => Promise<NextResponse>)`, `adminActionRoute<C>(fn: (req: NextRequest, actor: SessionAccount, ctx: C) => Promise<NextResponse>)`
  - route-helpers.ts: `guardAdmin(req): Promise<NextResponse | null>` (now async), `guardSignedIn(req): Promise<NextResponse | null>`

- [ ] **Step 1: Write the failing session tests** — `lib/auth/session.test.ts`

```ts
import { NextResponse } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { accountRow, request, SECRET, sessionCookie, stubAuthEnv, USER_ID } from '@/tests/fixtures'
import { getAccountById } from './accounts'
import { clearSessionCookie, getSessionAccount, SESSION_COOKIE, setSessionCookie } from './session'
import { signToken } from './tokens'

vi.mock('./accounts', () => ({ getAccountById: vi.fn() }))

const withCookie = (cookie?: string) => request('/api/x', { cookie, origin: null })

beforeEach(() => {
  stubAuthEnv()
  vi.mocked(getAccountById).mockReset().mockResolvedValue(accountRow())
})
afterEach(() => vi.unstubAllEnvs())

describe('getSessionAccount', () => {
  it('returns the account for a valid cookie of an active account', async () => {
    expect(await getSessionAccount(withCookie(sessionCookie(USER_ID)))).toEqual({
      id: USER_ID,
      email: 'somchai@example.com',
      fullName: 'สมชาย ใจดี',
      role: 'user',
      isRoot: false,
    })
  })

  it('returns null without a cookie and does not hit the database', async () => {
    expect(await getSessionAccount(withCookie())).toBeNull()
    expect(getAccountById).not.toHaveBeenCalled()
  })

  it('rejects a verify-email token presented as a session cookie', async () => {
    const t = signToken(SECRET, 'verify-email', { sub: USER_ID, iat: Date.now(), exp: Date.now() + 60_000 })
    expect(await getSessionAccount(withCookie(`${SESSION_COOKIE}=${t}`))).toBeNull()
  })

  it.each(['unverified', 'pending', 'disabled'] as const)('rejects a %s account', async (status) => {
    vi.mocked(getAccountById).mockResolvedValue(accountRow({ status }))
    expect(await getSessionAccount(withCookie(sessionCookie(USER_ID)))).toBeNull()
  })

  it('rejects a session issued before sessions_valid_after (password reset / sign-out everywhere)', async () => {
    const issued = Date.now() - 10_000
    vi.mocked(getAccountById).mockResolvedValue(accountRow({ sessions_valid_after: new Date(issued + 1).toISOString() }))
    expect(await getSessionAccount(withCookie(sessionCookie(USER_ID, issued)))).toBeNull()
  })

  it('rejects when the account was deleted', async () => {
    vi.mocked(getAccountById).mockResolvedValue(null)
    expect(await getSessionAccount(withCookie(sessionCookie(USER_ID)))).toBeNull()
  })

  it('returns null when DASHBOARD_SESSION_SECRET is missing', async () => {
    vi.stubEnv('DASHBOARD_SESSION_SECRET', '')
    expect(await getSessionAccount(withCookie(sessionCookie(USER_ID)))).toBeNull()
  })
})

describe('session cookie', () => {
  it('sets an httpOnly 12 h cookie that getSessionAccount accepts, and clears it', async () => {
    const res = NextResponse.json({})
    setSessionCookie(res, USER_ID)
    const cookie = res.cookies.get(SESSION_COOKIE)!
    expect(cookie.httpOnly).toBe(true)
    expect(cookie.sameSite).toBe('lax')
    expect(cookie.maxAge).toBe(43200)
    expect(await getSessionAccount(withCookie(`${SESSION_COOKIE}=${cookie.value}`))).not.toBeNull()

    clearSessionCookie(res)
    expect(res.cookies.get(SESSION_COOKIE)?.value).toBe('')
  })
})
```

- [ ] **Step 2: Write the failing http tests** — `lib/auth/http.test.ts`

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { accountRow, request, sessionCookie, stubAuthEnv, USER_ID } from '@/tests/fixtures'
import { getAccountById } from './accounts'
import { isSameOrigin, requireAccount } from './http'

vi.mock('./accounts', () => ({ getAccountById: vi.fn() }))

beforeEach(() => {
  stubAuthEnv()
  vi.mocked(getAccountById).mockReset().mockResolvedValue(accountRow())
})
afterEach(() => vi.unstubAllEnvs())

describe('isSameOrigin', () => {
  it('accepts the request origin and APP_BASE_URL, refuses others and missing', () => {
    expect(isSameOrigin(request('/x', { method: 'POST' }))).toBe(true)
    vi.stubEnv('APP_BASE_URL', 'https://dash.example')
    expect(isSameOrigin(request('/x', { method: 'POST', origin: 'https://dash.example' }))).toBe(true)
    expect(isSameOrigin(request('/x', { method: 'POST', origin: 'https://evil.example' }))).toBe(false)
    expect(isSameOrigin(request('/x', { method: 'POST', origin: null }))).toBe(false)
  })
})

describe('requireAccount', () => {
  it('answers 503 when the login system is not configured', async () => {
    vi.stubEnv('DASHBOARD_SESSION_SECRET', '')
    const r = await requireAccount(request('/x'), 'signed-in')
    expect('denied' in r && r.denied.status).toBe(503)
  })

  it('answers 401 without a session', async () => {
    const r = await requireAccount(request('/x'), 'signed-in')
    expect('denied' in r && r.denied.status).toBe(401)
  })

  it('answers 403 when a user calls an admin API', async () => {
    const r = await requireAccount(request('/x', { cookie: sessionCookie(USER_ID) }), 'admin')
    expect('denied' in r && r.denied.status).toBe(403)
  })

  it('returns the account when the role is enough', async () => {
    const r = await requireAccount(request('/x', { cookie: sessionCookie(USER_ID) }), 'signed-in')
    expect('account' in r && r.account.id).toBe(USER_ID)
    vi.mocked(getAccountById).mockResolvedValue(accountRow({ role: 'admin' }))
    const a = await requireAccount(request('/x', { cookie: sessionCookie(USER_ID) }), 'admin')
    expect('account' in a && a.account.role).toBe('admin')
  })

  it('answers 500 (not 200) when the database lookup fails', async () => {
    vi.mocked(getAccountById).mockRejectedValue(new Error('db down'))
    const r = await requireAccount(request('/x', { cookie: sessionCookie(USER_ID) }), 'signed-in')
    expect('denied' in r && r.denied.status).toBe(500)
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm test lib/auth/session.test.ts lib/auth/http.test.ts`
Expected: FAIL — cannot resolve `./session`, `./http`.

- [ ] **Step 4: Create `lib/auth/session.ts`**

```ts
/**
 * cookie เซสชันของแดชบอร์ด (dash_session) — เก็บแค่ { sub, iat, exp } ที่เซ็นด้วย HMAC
 * ทุกคำขออ่านแถว dashboard.accounts ใหม่ ปิดใช้งาน/ลบ/ลดสิทธิ์/รีเซ็ตรหัสผ่านจึงมีผลทันที
 */

import type { NextRequest, NextResponse } from 'next/server'
import { getAccountById, type AccountRow } from './accounts'
import { sessionSecret } from './config'
import type { Role } from './policy'
import { signToken, verifyToken } from './tokens'

export const SESSION_COOKIE = 'dash_session'
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12

export interface SessionAccount {
  id: string
  email: string
  fullName: string
  role: Role
  isRoot: boolean
}

const toSessionAccount = (row: AccountRow): SessionAccount => ({
  id: row.id,
  email: row.email,
  fullName: row.full_name,
  role: row.role,
  isRoot: row.is_root,
})

export function setSessionCookie(res: NextResponse, accountId: string, now = Date.now()): void {
  const secret = sessionSecret()
  if (!secret) throw new Error('DASHBOARD_SESSION_SECRET is not set (or is under 32 chars)')
  const token = signToken(secret, 'session', { sub: accountId, iat: now, exp: now + SESSION_MAX_AGE_SECONDS * 1000 })
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  })
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 })
}

export async function getSessionAccount(req: NextRequest, now = Date.now()): Promise<SessionAccount | null> {
  const secret = sessionSecret()
  if (!secret) return null
  const claims = verifyToken(secret, 'session', req.cookies.get(SESSION_COOKIE)?.value, now)
  if (!claims || typeof claims.iat !== 'number') return null

  const row = await getAccountById(claims.sub)
  if (!row || row.status !== 'active') return null
  // ออก token ก่อนการรีเซ็ตรหัสผ่านครั้งล่าสุด = ใช้ไม่ได้
  if (claims.iat <= Date.parse(row.sessions_valid_after)) return null
  return toSessionAccount(row)
}
```

- [ ] **Step 5: Create `lib/auth/http.ts`**

```ts
/** ตัวช่วยของ route handler ระบบบัญชี: รูปแบบคำตอบ, same-origin, ตรวจสิทธิ์ */

import { NextRequest, NextResponse } from 'next/server'
import { appBaseUrl, authConfigured } from './config'
import { getSessionAccount, type SessionAccount } from './session'

export const NO_STORE = { 'Cache-Control': 'no-store' }
export const FOREIGN_ORIGIN_MESSAGE = 'คำขอไม่ได้มาจากเว็บไซต์นี้'
const NOT_CONFIGURED = 'ระบบเข้าสู่ระบบยังไม่ได้ตั้งค่า (ดู .env.example)'
const FAILED = 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'

export const ok = (data: Record<string, unknown> = {}) => NextResponse.json({ ok: true, ...data }, { headers: NO_STORE })

export const jsonError = (error: string, status: number, extra: Record<string, unknown> = {}) =>
  NextResponse.json({ error, ...extra }, { status, headers: NO_STORE })

/** กัน CSRF: คำขอที่เปลี่ยนข้อมูลต้องมาจากเว็บนี้เท่านั้น (เบราว์เซอร์ส่ง Origin กับ POST/PATCH/DELETE เสมอ) */
export function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin')
  if (!origin) return false
  const base = appBaseUrl()
  return origin === req.nextUrl.origin || (!!base && origin === new URL(base).origin)
}

export async function readBody(req: NextRequest): Promise<Record<string, unknown>> {
  const body: unknown = await req.json().catch(() => null)
  return body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : {}
}

export const field = (body: Record<string, unknown>, key: string): string =>
  typeof body[key] === 'string' ? (body[key] as string) : ''

export type Need = 'signed-in' | 'admin'

/** 503 = ยังไม่ได้ตั้งค่า, 401 = ยังไม่ล็อกอิน/เซสชันใช้ไม่ได้, 403 = ไม่ใช่แอดมิน */
export async function requireAccount(
  req: NextRequest,
  need: Need,
): Promise<{ account: SessionAccount } | { denied: NextResponse }> {
  if (!authConfigured()) return { denied: jsonError(NOT_CONFIGURED, 503) }
  let account: SessionAccount | null
  try {
    account = await getSessionAccount(req)
  } catch (err) {
    console.error('[auth] ตรวจเซสชันไม่สำเร็จ:', err)
    return { denied: jsonError(FAILED, 500) }
  }
  if (!account) return { denied: jsonError('กรุณาเข้าสู่ระบบ', 401) }
  if (need === 'admin' && account.role !== 'admin') return { denied: jsonError('สำหรับผู้ดูแลระบบเท่านั้น', 403) }
  return { account }
}

async function run(req: NextRequest, fn: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await fn()
  } catch (err) {
    console.error(`[api${req.nextUrl.pathname}]`, err)
    return jsonError(FAILED, 500)
  }
}

/** route สาธารณะของระบบล็อกอินที่เปลี่ยนข้อมูล (POST): ตรวจการตั้งค่า + same-origin + จับ error */
export function publicAuthRoute(fn: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    if (!authConfigured()) return jsonError(NOT_CONFIGURED, 503)
    if (!isSameOrigin(req)) return jsonError(FOREIGN_ORIGIN_MESSAGE, 403)
    return run(req, () => fn(req))
  }
}

/** route ของแอดมินที่เปลี่ยนข้อมูล — ส่งบัญชีผู้เรียกให้ handler (ใช้กันแก้บัญชีตัวเอง) */
export function adminActionRoute<C>(fn: (req: NextRequest, actor: SessionAccount, ctx: C) => Promise<NextResponse>) {
  return async (req: NextRequest, ctx: C) => {
    if (!isSameOrigin(req)) return jsonError(FOREIGN_ORIGIN_MESSAGE, 403)
    const result = await requireAccount(req, 'admin')
    if ('denied' in result) return result.denied
    return run(req, () => fn(req, result.account, ctx))
  }
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm test lib/auth/session.test.ts lib/auth/http.test.ts`
Expected: PASS.

- [ ] **Step 7: Rewire `lib/db/route-helpers.ts`**

Replace lines 1–21 (imports and `guardAdmin`) with:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAccount } from '@/lib/auth/http'
import { PAGE_SIZE } from './constants'
import type { ListParams, Page } from './types'

/**
 * ป้องกัน API แอดมิน — ใช้เซสชันบัญชีแดชบอร์ด (ดู lib/auth/session.ts)
 * 401 = ยังไม่ล็อกอิน/เซสชันหมดอายุ, 403 = ไม่ใช่แอดมิน, 503 = ยังไม่ได้ตั้งค่าระบบล็อกอิน
 */
export async function guardAdmin(req: NextRequest): Promise<NextResponse | null> {
  const result = await requireAccount(req, 'admin')
  return 'denied' in result ? result.denied : null
}

/** ป้องกัน API ข้อมูลที่ผู้ใช้ทุกบทบาทที่ล็อกอินแล้วเห็นได้ */
export async function guardSignedIn(req: NextRequest): Promise<NextResponse | null> {
  const result = await requireAccount(req, 'signed-in')
  return 'denied' in result ? result.denied : null
}
```

and inside `handle()` change `const denied = guardAdmin(req)` to `const denied = await guardAdmin(req)`.

- [ ] **Step 8: Require sign-in on the two waste data APIs**

In `app/api/waste-dashboard/route.ts` add the import `import { guardSignedIn } from '@/lib/db/route-helpers'` and make these the first two lines inside `export async function GET(request: NextRequest) {`:

```ts
  const denied = await guardSignedIn(request)
  if (denied) return denied
```

Do the same in `app/api/waste/dashboard/route.ts`.

- [ ] **Step 9: Run all tests**

Run: `pnpm test`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add lib/auth/session.ts lib/auth/session.test.ts lib/auth/http.ts lib/auth/http.test.ts lib/db/route-helpers.ts app/api/waste-dashboard/route.ts app/api/waste/dashboard/route.ts
git commit -m "feat: Add dashboard session cookie and role guards

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Sign-up, email confirmation and resend routes

**Files:**
- Create: `app/api/auth/signup/route.ts`
- Create: `app/api/auth/verify-email/route.ts`
- Create: `app/api/auth/resend-verification/route.ts`
- Test: `tests/routes/signup.test.ts`

**Interfaces:**
- Consumes: Tasks 2–6 (`publicAuthRoute`, `readBody`, `field`, `ok`, `jsonError`, accounts functions, `createAuthUser`, `updateAuthUserPassword`, `AuthApiError`, `sendVerificationEmail`, `notifyRootOfSignup`, `verifyToken`, `sessionSecret`, policy helpers).
- Produces HTTP API:
  - `POST /api/auth/signup {fullName, email, password}` → `200 {ok: true, emailSent: boolean}` | `400 {error}` | `409 {error}`
  - `POST /api/auth/verify-email {token}` → `200 {ok: true}` | `400 {error}`
  - `POST /api/auth/resend-verification {email}` → always `200 {ok: true}`

- [ ] **Step 1: Write the failing route tests** — `tests/routes/signup.test.ts`

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { POST as resend } from '@/app/api/auth/resend-verification/route'
import { POST as signup } from '@/app/api/auth/signup/route'
import { POST as verify } from '@/app/api/auth/verify-email/route'
import { getAccountByEmail, getAccountById, updateAccounts } from '@/lib/auth/accounts'
import { notifyRootOfSignup, sendVerificationEmail } from '@/lib/auth/mailers'
import { AuthApiError, createAuthUser, updateAuthUserPassword } from '@/lib/auth/supabase-auth'
import { signToken } from '@/lib/auth/tokens'
import { accountRow, request, SECRET, stubAuthEnv, USER_ID } from '@/tests/fixtures'

vi.mock('@/lib/auth/accounts', async (orig) => ({
  ...(await orig<typeof import('@/lib/auth/accounts')>()),
  getAccountByEmail: vi.fn(),
  getAccountById: vi.fn(),
  updateAccounts: vi.fn(),
}))
vi.mock('@/lib/auth/supabase-auth', async (orig) => ({
  ...(await orig<typeof import('@/lib/auth/supabase-auth')>()),
  createAuthUser: vi.fn(),
  updateAuthUserPassword: vi.fn(),
}))
vi.mock('@/lib/auth/mailers', () => ({ sendVerificationEmail: vi.fn(), notifyRootOfSignup: vi.fn() }))

const body = { fullName: 'สมชาย ใจดี', email: 'somchai@example.com', password: 'password123' }
const signupReq = (b: unknown = body, origin?: string | null) => request('/api/auth/signup', { body: b, origin })

beforeEach(() => {
  stubAuthEnv()
  vi.resetAllMocks()
  vi.mocked(sendVerificationEmail).mockResolvedValue(true)
  vi.mocked(notifyRootOfSignup).mockResolvedValue(true)
})
afterEach(() => vi.unstubAllEnvs())

describe('POST /api/auth/signup', () => {
  it('creates an unverified account and emails the confirmation link', async () => {
    const created = accountRow({ status: 'unverified' })
    vi.mocked(getAccountByEmail).mockResolvedValue(null)
    vi.mocked(createAuthUser).mockResolvedValue(USER_ID)
    vi.mocked(getAccountById).mockResolvedValue(created)

    const res = await signup(signupReq())
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true, emailSent: true })
    expect(createAuthUser).toHaveBeenCalledWith({ fullName: 'สมชาย ใจดี', email: 'somchai@example.com', password: 'password123' })
    expect(sendVerificationEmail).toHaveBeenCalledWith(created)
  })

  it('normalizes the email before checking and creating', async () => {
    vi.mocked(getAccountByEmail).mockResolvedValue(null)
    vi.mocked(createAuthUser).mockResolvedValue(USER_ID)
    vi.mocked(getAccountById).mockResolvedValue(accountRow({ status: 'unverified' }))
    await signup(signupReq({ ...body, email: '  Somchai@Example.COM ' }))
    expect(getAccountByEmail).toHaveBeenCalledWith('somchai@example.com')
    expect(vi.mocked(createAuthUser).mock.calls[0][0].email).toBe('somchai@example.com')
  })

  it('still succeeds with emailSent false when email cannot be sent (e.g. Gmail not configured)', async () => {
    vi.mocked(getAccountByEmail).mockResolvedValue(null)
    vi.mocked(createAuthUser).mockResolvedValue(USER_ID)
    vi.mocked(getAccountById).mockResolvedValue(accountRow({ status: 'unverified' }))
    vi.mocked(sendVerificationEmail).mockResolvedValue(false)
    const res = await signup(signupReq())
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true, emailSent: false })
  })

  it('refreshes an unverified account instead of creating a new one', async () => {
    const existing = accountRow({ status: 'unverified', full_name: 'ชื่อเก่า' })
    const refreshed = { ...existing, full_name: 'สมชาย ใจดี' }
    vi.mocked(getAccountByEmail).mockResolvedValue(existing)
    vi.mocked(updateAccounts).mockResolvedValue([refreshed])

    const res = await signup(signupReq())
    expect(res.status).toBe(200)
    expect(createAuthUser).not.toHaveBeenCalled()
    expect(updateAccounts).toHaveBeenCalledWith({ id: `eq.${USER_ID}`, status: 'eq.unverified' }, { full_name: 'สมชาย ใจดี' })
    expect(updateAuthUserPassword).toHaveBeenCalledWith(USER_ID, 'password123')
    expect(sendVerificationEmail).toHaveBeenCalledWith(refreshed)
  })

  it('does not change the password if the account got verified meanwhile', async () => {
    vi.mocked(getAccountByEmail).mockResolvedValue(accountRow({ status: 'unverified' }))
    vi.mocked(updateAccounts).mockResolvedValue([])
    const res = await signup(signupReq())
    expect(res.status).toBe(409)
    expect(updateAuthUserPassword).not.toHaveBeenCalled()
  })

  it.each(['pending', 'active', 'disabled'] as const)('answers 409 for an existing %s account', async (status) => {
    vi.mocked(getAccountByEmail).mockResolvedValue(accountRow({ status }))
    expect((await signup(signupReq())).status).toBe(409)
    expect(createAuthUser).not.toHaveBeenCalled()
  })

  it('answers 409 when Supabase says the email already exists (race)', async () => {
    vi.mocked(getAccountByEmail).mockResolvedValue(null)
    vi.mocked(createAuthUser).mockRejectedValue(new AuthApiError(422, 'email_exists'))
    expect((await signup(signupReq())).status).toBe(409)
  })

  it('answers 400 for invalid input', async () => {
    expect((await signup(signupReq({ ...body, password: 'short' }))).status).toBe(400)
    expect((await signup(signupReq({ ...body, email: 'nope' }))).status).toBe(400)
    expect((await signup(signupReq({ ...body, fullName: '   ' }))).status).toBe(400)
  })

  it('refuses cross-site and origin-less requests', async () => {
    expect((await signup(signupReq(body, 'https://evil.example'))).status).toBe(403)
    expect((await signup(signupReq(body, null))).status).toBe(403)
  })

  it('answers 503 when the login system is not configured', async () => {
    vi.stubEnv('DASHBOARD_SESSION_SECRET', '')
    expect((await signup(signupReq())).status).toBe(503)
  })
})

describe('POST /api/auth/verify-email', () => {
  const tokenFor = (purpose: 'verify-email' | 'reset-password' = 'verify-email') =>
    signToken(SECRET, purpose, { sub: USER_ID, exp: Date.now() + 60_000 })

  it('moves unverified → pending and notifies the root admin', async () => {
    const pending = accountRow({ status: 'pending' })
    vi.mocked(updateAccounts).mockResolvedValue([pending])
    const res = await verify(request('/api/auth/verify-email', { body: { token: tokenFor() } }))
    expect(res.status).toBe(200)
    const [filters, patch] = vi.mocked(updateAccounts).mock.calls[0]
    expect(filters).toEqual({ id: `eq.${USER_ID}`, status: 'eq.unverified' })
    expect(patch).toMatchObject({ status: 'pending' })
    expect(notifyRootOfSignup).toHaveBeenCalledWith(pending)
  })

  it('answers 400 the second time the same link is used', async () => {
    vi.mocked(updateAccounts).mockResolvedValue([])
    const res = await verify(request('/api/auth/verify-email', { body: { token: tokenFor() } }))
    expect(res.status).toBe(400)
    expect(notifyRootOfSignup).not.toHaveBeenCalled()
  })

  it('rejects a reset-password token and garbage without touching the database', async () => {
    for (const token of [tokenFor('reset-password'), 'garbage', '']) {
      expect((await verify(request('/api/auth/verify-email', { body: { token } }))).status).toBe(400)
    }
    expect(updateAccounts).not.toHaveBeenCalled()
  })
})

describe('POST /api/auth/resend-verification', () => {
  it('resends only for unverified accounts and always answers ok', async () => {
    vi.mocked(getAccountByEmail).mockResolvedValueOnce(accountRow({ status: 'unverified' }))
    expect((await resend(request('/api/auth/resend-verification', { body: { email: 'Somchai@example.com' } }))).status).toBe(200)
    expect(sendVerificationEmail).toHaveBeenCalledTimes(1)

    vi.mocked(getAccountByEmail).mockResolvedValueOnce(accountRow({ status: 'active' }))
    expect((await resend(request('/api/auth/resend-verification', { body: { email: 'somchai@example.com' } }))).status).toBe(200)
    vi.mocked(getAccountByEmail).mockResolvedValueOnce(null)
    expect((await resend(request('/api/auth/resend-verification', { body: { email: 'nobody@example.com' } }))).status).toBe(200)
    expect(sendVerificationEmail).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test tests/routes/signup.test.ts`
Expected: FAIL — cannot resolve `@/app/api/auth/resend-verification/route`.

- [ ] **Step 3: Create `app/api/auth/signup/route.ts`**

```ts
import { getAccountByEmail, getAccountById, updateAccounts, type AccountRow } from '@/lib/auth/accounts'
import { field, jsonError, ok, publicAuthRoute, readBody } from '@/lib/auth/http'
import { sendVerificationEmail } from '@/lib/auth/mailers'
import { cleanName, normalizeEmail, signupDecision, signupError } from '@/lib/auth/policy'
import { AuthApiError, createAuthUser, updateAuthUserPassword } from '@/lib/auth/supabase-auth'

const ALREADY_REGISTERED = 'อีเมลนี้ลงทะเบียนแล้ว — เข้าสู่ระบบ หรือใช้ "ลืมรหัสผ่าน"'

/**
 * สมัครบัญชีแดชบอร์ด → สถานะ unverified + ส่งลิงก์ยืนยันอีเมล
 * อีเมลที่ยัง unverified สมัครซ้ำได้: แทนชื่อ/รหัสผ่านแล้วส่งลิงก์ใหม่ (คนที่เข้าอีเมลได้จริงคือเจ้าของบัญชี)
 */
export const POST = publicAuthRoute(async (req) => {
  const body = await readBody(req)
  const input = {
    fullName: cleanName(field(body, 'fullName')),
    email: normalizeEmail(field(body, 'email')),
    password: field(body, 'password'),
  }
  const invalid = signupError(input)
  if (invalid) return jsonError(invalid, 400)

  const existing = await getAccountByEmail(input.email)
  const decision = signupDecision(existing?.status ?? null)
  if (decision === 'already-registered') return jsonError(ALREADY_REGISTERED, 409)

  let account: AccountRow | null
  if (decision === 'create') {
    try {
      // trigger dashboard_on_auth_user_created สร้างแถว dashboard.accounts ใน transaction เดียวกัน
      account = await getAccountById(await createAuthUser(input))
    } catch (err) {
      if (err instanceof AuthApiError && err.status === 422) return jsonError(ALREADY_REGISTERED, 409)
      throw err
    }
    if (!account) throw new Error('dashboard.accounts row missing after createAuthUser — is the trigger installed?')
  } else {
    // อัปเดตแบบมีเงื่อนไขก่อน: ถ้าเจ้าของเพิ่งยืนยันอีเมลไปแล้ว จะไม่แตะรหัสผ่าน
    account = (await updateAccounts({ id: `eq.${existing!.id}`, status: 'eq.unverified' }, { full_name: input.fullName }))[0] ?? null
    if (!account) return jsonError(ALREADY_REGISTERED, 409)
    await updateAuthUserPassword(account.id, input.password)
  }

  return ok({ emailSent: await sendVerificationEmail(account) })
})
```

- [ ] **Step 4: Create `app/api/auth/verify-email/route.ts`**

```ts
import { updateAccounts } from '@/lib/auth/accounts'
import { sessionSecret } from '@/lib/auth/config'
import { field, jsonError, ok, publicAuthRoute, readBody } from '@/lib/auth/http'
import { notifyRootOfSignup } from '@/lib/auth/mailers'
import { LINK_INVALID_MESSAGE } from '@/lib/auth/policy'
import { verifyToken } from '@/lib/auth/tokens'

/**
 * ยืนยันอีเมล: unverified → pending แล้วแจ้ง root admin
 * เป็น POST จากปุ่มในหน้า /verify-email (ไม่ใช่ GET) — ตัวสแกนลิงก์ในอีเมลจึงกดแทนผู้ใช้ไม่ได้
 * อัปเดตแบบมีเงื่อนไข status = unverified ทำให้ลิงก์ใช้ได้ครั้งเดียว
 */
export const POST = publicAuthRoute(async (req) => {
  const claims = verifyToken(sessionSecret() ?? '', 'verify-email', field(await readBody(req), 'token'))
  if (!claims) return jsonError(LINK_INVALID_MESSAGE, 400)

  const [account] = await updateAccounts(
    { id: `eq.${claims.sub}`, status: 'eq.unverified' },
    { status: 'pending', email_verified_at: new Date().toISOString() },
  )
  if (!account) return jsonError(LINK_INVALID_MESSAGE, 400)

  await notifyRootOfSignup(account)
  return ok()
})
```

- [ ] **Step 5: Create `app/api/auth/resend-verification/route.ts`**

```ts
import { getAccountByEmail } from '@/lib/auth/accounts'
import { field, ok, publicAuthRoute, readBody } from '@/lib/auth/http'
import { sendVerificationEmail } from '@/lib/auth/mailers'
import { isEmail, normalizeEmail } from '@/lib/auth/policy'

/** ส่งลิงก์ยืนยันอีเมลอีกครั้ง — ตอบเหมือนกันทุกกรณี เพื่อไม่ให้ใช้ตรวจว่าอีเมลไหนมีบัญชี */
export const POST = publicAuthRoute(async (req) => {
  const email = normalizeEmail(field(await readBody(req), 'email'))
  const account = isEmail(email) ? await getAccountByEmail(email) : null
  if (account?.status === 'unverified') await sendVerificationEmail(account)
  return ok()
})
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm test tests/routes/signup.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add app/api/auth/signup app/api/auth/verify-email app/api/auth/resend-verification tests/routes/signup.test.ts
git commit -m "feat: Add dashboard sign-up and email confirmation API

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Login, logout, session, forgot and reset password routes

**Files:**
- Create: `app/api/auth/login/route.ts`
- Create: `app/api/auth/logout/route.ts`
- Create: `app/api/auth/session/route.ts`
- Create: `app/api/auth/forgot-password/route.ts`
- Create: `app/api/auth/reset-password/route.ts`
- Test: `tests/routes/login.test.ts`

**Interfaces:**
- Consumes: Tasks 2–6.
- Produces HTTP API:
  - `POST /api/auth/login {email, password, next?}` → `200 {ok: true, redirect: string}` + `Set-Cookie: dash_session` | `400` | `401 {error}` | `403 {error, reason: 'unverified'|'pending'|'disabled'}` | `429 {error}`
  - `POST /api/auth/logout` → `200 {ok: true}`, clears cookie
  - `GET /api/auth/session` → `200 {account: SessionAccount}` | `401` | `503`
  - `POST /api/auth/forgot-password {email}` → always `200 {ok: true}`
  - `POST /api/auth/reset-password {token, password}` → `200 {ok: true}` | `400 {error}`

- [ ] **Step 1: Write the failing route tests** — `tests/routes/login.test.ts`

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { POST as forgot } from '@/app/api/auth/forgot-password/route'
import { POST as login } from '@/app/api/auth/login/route'
import { POST as logout } from '@/app/api/auth/logout/route'
import { POST as reset } from '@/app/api/auth/reset-password/route'
import { GET as session } from '@/app/api/auth/session/route'
import { getAccountByEmail, getAccountById, updateAccounts } from '@/lib/auth/accounts'
import { sendPasswordResetEmail } from '@/lib/auth/mailers'
import { AuthApiError, updateAuthUserPassword, verifyPassword } from '@/lib/auth/supabase-auth'
import { signToken } from '@/lib/auth/tokens'
import { accountRow, request, SECRET, sessionCookie, stubAuthEnv, USER_ID } from '@/tests/fixtures'

vi.mock('@/lib/auth/accounts', async (orig) => ({
  ...(await orig<typeof import('@/lib/auth/accounts')>()),
  getAccountByEmail: vi.fn(),
  getAccountById: vi.fn(),
  updateAccounts: vi.fn(),
}))
vi.mock('@/lib/auth/supabase-auth', async (orig) => ({
  ...(await orig<typeof import('@/lib/auth/supabase-auth')>()),
  verifyPassword: vi.fn(),
  updateAuthUserPassword: vi.fn(),
}))
vi.mock('@/lib/auth/mailers', () => ({ sendPasswordResetEmail: vi.fn() }))

const loginReq = (b: Record<string, unknown>) => request('/api/auth/login', { body: b })

beforeEach(() => {
  stubAuthEnv()
  vi.resetAllMocks()
  vi.mocked(verifyPassword).mockResolvedValue(USER_ID)
  vi.mocked(getAccountById).mockResolvedValue(accountRow())
})
afterEach(() => vi.unstubAllEnvs())

describe('POST /api/auth/login', () => {
  it('logs an active user in, sets the session cookie and sends them to /map', async () => {
    const res = await login(loginReq({ email: 'somchai@example.com', password: 'password123' }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true, redirect: '/map' })
    expect(res.cookies.get('dash_session')?.value).toBeTruthy()
  })

  it('normalizes the email before checking the password', async () => {
    await login(loginReq({ email: '  Somchai@Example.COM ', password: 'password123' }))
    expect(verifyPassword).toHaveBeenCalledWith('somchai@example.com', 'password123')
  })

  it('honours next for an admin, but never sends a user into /admin', async () => {
    vi.mocked(getAccountById).mockResolvedValue(accountRow({ role: 'admin' }))
    const admin = await login(loginReq({ email: 'a@b.co', password: 'x', next: '/admin/users' }))
    expect((await admin.json()).redirect).toBe('/admin/users')

    vi.mocked(getAccountById).mockResolvedValue(accountRow({ role: 'user' }))
    const user = await login(loginReq({ email: 'a@b.co', password: 'x', next: '/admin/users' }))
    expect((await user.json()).redirect).toBe('/map')
  })

  it('answers 401 for a wrong password', async () => {
    vi.mocked(verifyPassword).mockResolvedValue(null)
    const res = await login(loginReq({ email: 'a@b.co', password: 'wrong' }))
    expect(res.status).toBe(401)
    expect(res.cookies.get('dash_session')).toBeUndefined()
  })

  it('answers 401 for a Supabase user that has no dashboard account', async () => {
    vi.mocked(getAccountById).mockResolvedValue(null)
    expect((await login(loginReq({ email: 'a@b.co', password: 'x' }))).status).toBe(401)
  })

  it.each(['unverified', 'pending', 'disabled'] as const)('answers 403 with reason for a %s account, without a cookie', async (status) => {
    vi.mocked(getAccountById).mockResolvedValue(accountRow({ status }))
    const res = await login(loginReq({ email: 'a@b.co', password: 'x' }))
    expect(res.status).toBe(403)
    expect((await res.json()).reason).toBe(status)
    expect(res.cookies.get('dash_session')).toBeUndefined()
  })

  it('answers 429 with a Thai message when Supabase rate-limits sign-ins', async () => {
    vi.mocked(verifyPassword).mockRejectedValue(new AuthApiError(429, 'rate limited'))
    const res = await login(loginReq({ email: 'a@b.co', password: 'x' }))
    expect(res.status).toBe(429)
    expect((await res.json()).error).toMatch(/บ่อยเกินไป/)
  })

  it('answers 400 when fields are missing', async () => {
    expect((await login(loginReq({ email: '', password: '' }))).status).toBe(400)
  })
})

describe('session and logout', () => {
  it('returns the signed-in account, or 401', async () => {
    const ok = await session(request('/api/auth/session', { cookie: sessionCookie(USER_ID) }))
    expect(ok.status).toBe(200)
    expect((await ok.json()).account).toMatchObject({ id: USER_ID, role: 'user', fullName: 'สมชาย ใจดี' })
    expect((await session(request('/api/auth/session'))).status).toBe(401)
  })

  it('logout clears the cookie, and refuses cross-site calls', async () => {
    const res = await logout(request('/api/auth/logout', { method: 'POST' }))
    expect(res.status).toBe(200)
    expect(res.cookies.get('dash_session')?.value).toBe('')
    expect((await logout(request('/api/auth/logout', { method: 'POST', origin: 'https://evil.example' }))).status).toBe(403)
  })
})

describe('POST /api/auth/forgot-password', () => {
  it('sends a reset link for non-disabled accounts and always answers ok', async () => {
    for (const status of ['active', 'pending', 'unverified'] as const) {
      vi.mocked(getAccountByEmail).mockResolvedValueOnce(accountRow({ status }))
      expect((await forgot(request('/api/auth/forgot-password', { body: { email: 'a@b.co' } }))).status).toBe(200)
    }
    expect(sendPasswordResetEmail).toHaveBeenCalledTimes(3)

    vi.mocked(getAccountByEmail).mockResolvedValueOnce(accountRow({ status: 'disabled' }))
    expect((await forgot(request('/api/auth/forgot-password', { body: { email: 'a@b.co' } }))).status).toBe(200)
    vi.mocked(getAccountByEmail).mockResolvedValueOnce(null)
    expect((await forgot(request('/api/auth/forgot-password', { body: { email: 'nobody@b.co' } }))).status).toBe(200)
    expect(sendPasswordResetEmail).toHaveBeenCalledTimes(3)
  })
})

describe('POST /api/auth/reset-password', () => {
  const account = accountRow()
  const sva = Date.parse(account.sessions_valid_after)
  const resetToken = (over: { sva?: number } = {}) =>
    signToken(SECRET, 'reset-password', { sub: USER_ID, sva, exp: Date.now() + 60_000, ...over })
  const resetReq = (token: string, password = 'newpassword1') => request('/api/auth/reset-password', { body: { token, password } })

  it('claims the link by bumping sessions_valid_after, then sets the new password', async () => {
    vi.mocked(updateAccounts).mockResolvedValue([account])
    const res = await reset(resetReq(resetToken()))
    expect(res.status).toBe(200)
    const [filters, patch] = vi.mocked(updateAccounts).mock.calls[0]
    expect(filters).toEqual({ id: `eq.${USER_ID}`, sessions_valid_after: `eq.${account.sessions_valid_after}` })
    expect(Object.keys(patch)).toEqual(['sessions_valid_after'])
    expect(updateAuthUserPassword).toHaveBeenCalledWith(USER_ID, 'newpassword1')
  })

  it('answers 400 for a link issued before the last reset (already used)', async () => {
    const res = await reset(resetReq(resetToken({ sva: sva - 1 })))
    expect(res.status).toBe(400)
    expect(updateAccounts).not.toHaveBeenCalled()
    expect(updateAuthUserPassword).not.toHaveBeenCalled()
  })

  it('answers 400 when another request used the link first', async () => {
    vi.mocked(updateAccounts).mockResolvedValue([])
    expect((await reset(resetReq(resetToken()))).status).toBe(400)
    expect(updateAuthUserPassword).not.toHaveBeenCalled()
  })

  it('answers 400 for a disabled account, a weak password or a verify-email token', async () => {
    vi.mocked(getAccountById).mockResolvedValueOnce(accountRow({ status: 'disabled' }))
    expect((await reset(resetReq(resetToken()))).status).toBe(400)
    expect((await reset(resetReq(resetToken(), 'short'))).status).toBe(400)
    const wrongPurpose = signToken(SECRET, 'verify-email', { sub: USER_ID, sva, exp: Date.now() + 60_000 })
    expect((await reset(resetReq(wrongPurpose))).status).toBe(400)
    expect(updateAuthUserPassword).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test tests/routes/login.test.ts`
Expected: FAIL — cannot resolve `@/app/api/auth/forgot-password/route`.

- [ ] **Step 3: Create `app/api/auth/login/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { getAccountById } from '@/lib/auth/accounts'
import { field, jsonError, NO_STORE, publicAuthRoute, readBody } from '@/lib/auth/http'
import { LOGIN_BLOCK_MESSAGES, normalizeEmail, safeNext } from '@/lib/auth/policy'
import { setSessionCookie } from '@/lib/auth/session'
import { AuthApiError, verifyPassword } from '@/lib/auth/supabase-auth'

/** หน่วงเวลาเมื่อรหัสผิด ให้การเดารหัสช้าลง */
const WRONG_CREDENTIALS_DELAY_MS = 800

export const POST = publicAuthRoute(async (req) => {
  const body = await readBody(req)
  const email = normalizeEmail(field(body, 'email'))
  const password = field(body, 'password')
  if (!email || !password) return jsonError('กรุณากรอกอีเมลและรหัสผ่าน', 400)

  let userId: string | null
  try {
    userId = await verifyPassword(email, password)
  } catch (err) {
    if (err instanceof AuthApiError && err.status === 429) {
      return jsonError('พยายามเข้าสู่ระบบบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่', 429)
    }
    throw err
  }

  // ผู้ใช้ Supabase Auth ที่ไม่มีแถวใน dashboard.accounts (เช่นบัญชีของแอปอื่น) ไม่ใช่บัญชีแดชบอร์ด
  const account = userId ? await getAccountById(userId) : null
  if (!account) {
    await new Promise((r) => setTimeout(r, WRONG_CREDENTIALS_DELAY_MS))
    return jsonError('อีเมลหรือรหัสผ่านไม่ถูกต้อง', 401)
  }
  // บอกสาเหตุได้เพราะผ่านการตรวจรหัสผ่านแล้ว
  if (account.status !== 'active') return jsonError(LOGIN_BLOCK_MESSAGES[account.status], 403, { reason: account.status })

  const res = NextResponse.json({ ok: true, redirect: safeNext(body.next, account.role) }, { headers: NO_STORE })
  setSessionCookie(res, account.id)
  return res
})
```

- [ ] **Step 4: Create `app/api/auth/logout/route.ts`**

```ts
import { NextRequest } from 'next/server'
import { FOREIGN_ORIGIN_MESSAGE, isSameOrigin, jsonError, ok } from '@/lib/auth/http'
import { clearSessionCookie } from '@/lib/auth/session'

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return jsonError(FOREIGN_ORIGIN_MESSAGE, 403)
  const res = ok()
  clearSessionCookie(res)
  return res
}
```

- [ ] **Step 5: Create `app/api/auth/session/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { NO_STORE, requireAccount } from '@/lib/auth/http'

/** ให้หน้าเว็บถามว่าใครล็อกอินอยู่: { account } หรือ 401 */
export async function GET(req: NextRequest) {
  const result = await requireAccount(req, 'signed-in')
  return 'denied' in result ? result.denied : NextResponse.json({ account: result.account }, { headers: NO_STORE })
}
```

- [ ] **Step 6: Create `app/api/auth/forgot-password/route.ts`**

```ts
import { getAccountByEmail } from '@/lib/auth/accounts'
import { field, ok, publicAuthRoute, readBody } from '@/lib/auth/http'
import { sendPasswordResetEmail } from '@/lib/auth/mailers'
import { isEmail, normalizeEmail } from '@/lib/auth/policy'

/** ส่งลิงก์ตั้งรหัสผ่านใหม่ — ตอบเหมือนกันทุกกรณี เพื่อไม่ให้ใช้ตรวจว่าอีเมลไหนมีบัญชี */
export const POST = publicAuthRoute(async (req) => {
  const email = normalizeEmail(field(await readBody(req), 'email'))
  const account = isEmail(email) ? await getAccountByEmail(email) : null
  if (account && account.status !== 'disabled') await sendPasswordResetEmail(account)
  return ok()
})
```

- [ ] **Step 7: Create `app/api/auth/reset-password/route.ts`**

```ts
import { getAccountById, updateAccounts } from '@/lib/auth/accounts'
import { sessionSecret } from '@/lib/auth/config'
import { field, jsonError, ok, publicAuthRoute, readBody } from '@/lib/auth/http'
import { LINK_INVALID_MESSAGE, passwordError } from '@/lib/auth/policy'
import { updateAuthUserPassword } from '@/lib/auth/supabase-auth'
import { verifyToken } from '@/lib/auth/tokens'

export const POST = publicAuthRoute(async (req) => {
  const body = await readBody(req)
  const password = field(body, 'password')
  const weak = passwordError(password)
  if (weak) return jsonError(weak, 400)

  const claims = verifyToken(sessionSecret() ?? '', 'reset-password', field(body, 'token'))
  const account = claims ? await getAccountById(claims.sub) : null
  if (!claims || !account || account.status === 'disabled' || Date.parse(account.sessions_valid_after) !== claims.sva) {
    return jsonError(LINK_INVALID_MESSAGE, 400)
  }

  // ใช้ลิงก์ได้ครั้งเดียว: เลื่อน sessions_valid_after แบบมีเงื่อนไขก่อน (ทุกเซสชันเดิมใช้ไม่ได้ทันที)
  const [claimed] = await updateAccounts(
    { id: `eq.${account.id}`, sessions_valid_after: `eq.${account.sessions_valid_after}` },
    { sessions_valid_after: new Date().toISOString() },
  )
  if (!claimed) return jsonError(LINK_INVALID_MESSAGE, 400)

  await updateAuthUserPassword(account.id, password)
  return ok()
})
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `pnpm test tests/routes/login.test.ts`
Expected: PASS (the two 401 cases each take ~0.8 s).

- [ ] **Step 9: Commit**

```bash
git add app/api/auth/login app/api/auth/logout app/api/auth/session app/api/auth/forgot-password app/api/auth/reset-password tests/routes/login.test.ts
git commit -m "feat: Add dashboard login, session and password reset API

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Admin account management API

**Files:**
- Create: `app/api/admin/accounts/route.ts`
- Create: `app/api/admin/accounts/[id]/route.ts`
- Test: `tests/routes/admin-accounts.test.ts`

**Interfaces:**
- Consumes: `listRoute` (route-helpers, Task 6), `adminActionRoute`, accounts functions, `planAccountAction`, `protectedRefusal`, `STALE_MESSAGE`, `sendDecisionEmail`, `deleteAuthUser`.
- Produces HTTP API:
  - `GET /api/admin/accounts?page&pageSize&status&q` → `200 Page<AccountListItem>`
  - `PATCH /api/admin/accounts/:id {action: 'approve'|'reject'|'set-role'|'disable'|'enable', role?}` → `200 {account: AccountRow, emailSent?: boolean}` | `400` | `403` | `404` | `409`
  - `DELETE /api/admin/accounts/:id` → `200 {ok: true}` | `403` | `404`

- [ ] **Step 1: Write the failing route tests** — `tests/routes/admin-accounts.test.ts`

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DELETE as remove, PATCH as patch } from '@/app/api/admin/accounts/[id]/route'
import { GET as list } from '@/app/api/admin/accounts/route'
import { getAccountById, listAccounts, updateAccounts, type AccountRow } from '@/lib/auth/accounts'
import { sendDecisionEmail } from '@/lib/auth/mailers'
import { deleteAuthUser } from '@/lib/auth/supabase-auth'
import { accountRow, ADMIN_ID, request, ROOT_ID, sessionCookie, stubAuthEnv, USER_ID } from '@/tests/fixtures'

vi.mock('@/lib/auth/accounts', async (orig) => ({
  ...(await orig<typeof import('@/lib/auth/accounts')>()),
  getAccountById: vi.fn(),
  listAccounts: vi.fn(),
  updateAccounts: vi.fn(),
}))
vi.mock('@/lib/auth/supabase-auth', async (orig) => ({
  ...(await orig<typeof import('@/lib/auth/supabase-auth')>()),
  deleteAuthUser: vi.fn(),
}))
vi.mock('@/lib/auth/mailers', () => ({ sendDecisionEmail: vi.fn() }))

const rows: Record<string, AccountRow> = {}
const ctx = (id: string) => ({ params: Promise.resolve({ id }) })
const asAdmin = { cookie: sessionCookie(ADMIN_ID) }

beforeEach(() => {
  stubAuthEnv()
  vi.resetAllMocks()
  rows[ADMIN_ID] = accountRow({ id: ADMIN_ID, email: 'admin@example.com', role: 'admin' })
  rows[ROOT_ID] = accountRow({ id: ROOT_ID, email: 'root@example.com', role: 'admin', is_root: true })
  rows[USER_ID] = accountRow({ id: USER_ID, status: 'pending', approved_at: null, approved_by: null })
  vi.mocked(getAccountById).mockImplementation(async (id) => rows[id] ?? null)
  vi.mocked(sendDecisionEmail).mockResolvedValue(true)
})
afterEach(() => vi.unstubAllEnvs())

describe('access', () => {
  it('answers 401 without a session and 403 for a user', async () => {
    expect((await list(request('/api/admin/accounts'))).status).toBe(401)
    rows[USER_ID] = accountRow({ id: USER_ID, role: 'user', status: 'active' })
    expect((await list(request('/api/admin/accounts', { cookie: sessionCookie(USER_ID) }))).status).toBe(403)
    const res = await patch(request(`/api/admin/accounts/${ADMIN_ID}`, { method: 'PATCH', body: { action: 'disable' }, cookie: sessionCookie(USER_ID) }), ctx(ADMIN_ID))
    expect(res.status).toBe(403)
    expect(updateAccounts).not.toHaveBeenCalled()
  })

  it('lists accounts for an admin', async () => {
    vi.mocked(listAccounts).mockResolvedValue({ rows: [], total: 0 })
    const res = await list(request('/api/admin/accounts?status=pending&page=1', asAdmin))
    expect(res.status).toBe(200)
    expect(vi.mocked(listAccounts).mock.calls[0][0]).toMatchObject({ status: 'pending', page: 1 })
  })
})

describe('PATCH /api/admin/accounts/:id', () => {
  const act = (id: string, body: unknown, origin?: string) =>
    patch(request(`/api/admin/accounts/${id}`, { method: 'PATCH', body, origin, ...asAdmin }), ctx(id))

  it('approves a pending account as admin with a conditional update and emails the person', async () => {
    const approved = { ...rows[USER_ID], status: 'active' as const, role: 'admin' as const }
    vi.mocked(updateAccounts).mockResolvedValue([approved])
    const res = await act(USER_ID, { action: 'approve', role: 'admin' })
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ emailSent: true, account: { status: 'active', role: 'admin' } })
    const [filters, patchBody] = vi.mocked(updateAccounts).mock.calls[0]
    expect(filters).toEqual({ id: `eq.${USER_ID}`, status: 'eq.pending', is_root: 'is.false' })
    expect(patchBody).toMatchObject({ status: 'active', role: 'admin', approved_by: ADMIN_ID })
    expect(sendDecisionEmail).toHaveBeenCalledWith(approved, 'approved')
  })

  it('reports emailSent false when the decision email fails, but keeps the change', async () => {
    vi.mocked(updateAccounts).mockResolvedValue([{ ...rows[USER_ID], status: 'disabled' }])
    vi.mocked(sendDecisionEmail).mockResolvedValue(false)
    const res = await act(USER_ID, { action: 'reject' })
    expect(res.status).toBe(200)
    expect((await res.json()).emailSent).toBe(false)
  })

  it('answers 409 when another admin changed the account first', async () => {
    vi.mocked(updateAccounts).mockResolvedValue([])
    const res = await act(USER_ID, { action: 'approve', role: 'user' })
    expect(res.status).toBe(409)
    expect(sendDecisionEmail).not.toHaveBeenCalled()
  })

  it('refuses to change the root account or your own account', async () => {
    expect((await act(ROOT_ID, { action: 'disable' })).status).toBe(403)
    expect((await act(ADMIN_ID, { action: 'set-role', role: 'user' })).status).toBe(403)
    expect(updateAccounts).not.toHaveBeenCalled()
  })

  it('answers 404 for an unknown account, 400 for a bad action, 403 cross-site', async () => {
    expect((await act('44444444-4444-4444-8444-444444444444', { action: 'disable' })).status).toBe(404)
    expect((await act(USER_ID, { action: 'nuke' })).status).toBe(400)
    expect((await act(USER_ID, { action: 'reject' }, 'https://evil.example')).status).toBe(403)
  })
})

describe('DELETE /api/admin/accounts/:id', () => {
  const del = (id: string) => remove(request(`/api/admin/accounts/${id}`, { method: 'DELETE', ...asAdmin }), ctx(id))

  it('deletes the Supabase Auth user (the row cascades)', async () => {
    expect((await del(USER_ID)).status).toBe(200)
    expect(deleteAuthUser).toHaveBeenCalledWith(USER_ID)
  })

  it('refuses root and self, and answers 404 for unknown ids', async () => {
    expect((await del(ROOT_ID)).status).toBe(403)
    expect((await del(ADMIN_ID)).status).toBe(403)
    expect((await del('44444444-4444-4444-8444-444444444444')).status).toBe(404)
    expect(deleteAuthUser).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test tests/routes/admin-accounts.test.ts`
Expected: FAIL — cannot resolve `@/app/api/admin/accounts/[id]/route`.

- [ ] **Step 3: Create `app/api/admin/accounts/route.ts`**

```ts
import { listAccounts } from '@/lib/auth/accounts'
import { listRoute } from '@/lib/db/route-helpers'

/** รายการบัญชีแดชบอร์ด (ตัวกรอง status, ค้นหา q จากชื่อ/อีเมล, แบ่งหน้า) */
export const GET = listRoute(listAccounts)
```

- [ ] **Step 4: Create `app/api/admin/accounts/[id]/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { getAccountById, updateAccounts } from '@/lib/auth/accounts'
import { adminActionRoute, field, jsonError, NO_STORE, ok, readBody } from '@/lib/auth/http'
import { sendDecisionEmail } from '@/lib/auth/mailers'
import { planAccountAction, protectedRefusal, STALE_MESSAGE } from '@/lib/auth/policy'
import { deleteAuthUser } from '@/lib/auth/supabase-auth'

type Ctx = { params: Promise<{ id: string }> }

const NOT_FOUND = 'ไม่พบบัญชีนี้ (อาจถูกลบไปแล้ว)'

/** อนุมัติ/ปฏิเสธ/เปลี่ยนบทบาท/ปิด/เปิดใช้งาน — บัญชี root และบัญชีของตัวเองแก้ไม่ได้ */
export const PATCH = adminActionRoute<Ctx>(async (req, actor, { params }) => {
  const target = await getAccountById((await params).id)
  if (!target) return jsonError(NOT_FOUND, 404)

  const body = await readBody(req)
  const plan = planAccountAction(actor.id, target, field(body, 'action'), body.role)
  if (!plan.ok) return jsonError(plan.error, plan.status)

  // อัปเดตแบบมีเงื่อนไข: ถ้าแอดมินอีกคนเปลี่ยนสถานะไปก่อน จะได้ 409 แทนการเขียนทับ
  const [updated] = await updateAccounts(
    { id: `eq.${target.id}`, status: `eq.${plan.expectStatus}`, is_root: 'is.false' },
    plan.patch,
  )
  if (!updated) return jsonError(STALE_MESSAGE, 409)

  const emailSent = plan.notify ? await sendDecisionEmail(updated, plan.notify) : undefined
  return NextResponse.json({ account: updated, emailSent }, { headers: NO_STORE })
})

export const DELETE = adminActionRoute<Ctx>(async (_req, actor, { params }) => {
  const target = await getAccountById((await params).id)
  if (!target) return jsonError(NOT_FOUND, 404)
  const refusal = protectedRefusal(actor.id, target)
  if (refusal) return jsonError(refusal.error, refusal.status)

  // ลบผู้ใช้ใน Supabase Auth → แถวใน dashboard.accounts ถูกลบตาม (on delete cascade)
  await deleteAuthUser(target.id)
  return ok()
})
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test`
Expected: PASS (all suites).

- [ ] **Step 6: Commit**

```bash
git add app/api/admin/accounts tests/routes/admin-accounts.test.ts
git commit -m "feat: Add admin API for approving and managing dashboard accounts

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Database schema and root-admin scripts

**Files:**
- Create: `supabase/dashboard_schema.sql`
- Create: `supabase/dashboard_schema_checks.sql`
- Create: `scripts/lib.mjs`, `scripts/create-root-admin.mjs`, `scripts/transfer-root.mjs`
- Modify: `package.json` (scripts `create-root-admin`, `transfer-root`)

**Interfaces:**
- Produces: schema `dashboard`, table `dashboard.accounts` (columns exactly as `AccountRow` in Task 3), trigger `dashboard_on_auth_user_created`, function `dashboard.transfer_root(p_new_root uuid)` (raises `DB001` not found, `DB002` not active), commands `pnpm run create-root-admin <email>`, `pnpm run transfer-root <email>`.

No Docker in this environment, so SQL is verified by running `supabase/dashboard_schema_checks.sql` against the real project in Task 14. Scripts are verified for syntax here.

- [ ] **Step 1: Create `supabase/dashboard_schema.sql`**

```sql
-- ============================================================================
-- dashboard_schema.sql — บัญชีเข้าสู่ระบบของแดชบอร์ด (แยกจาก schema `app` ของแอปจัดการขยะ)
--
-- รันครั้งเดียวใน Supabase → SQL Editor (รันซ้ำได้) แล้ว:
--   1) Settings → API → Exposed schemas: เพิ่ม `dashboard`
--   2) Authentication → Providers → Email: ปิด "Allow new users to sign up"
--   3) pnpm run create-root-admin <email>
--
-- Supabase Auth เก็บแค่อีเมล+รหัสผ่าน; บทบาท/สถานะอยู่ที่ dashboard.accounts
-- ============================================================================

create schema if not exists dashboard;

create table if not exists dashboard.accounts (
  id                   uuid primary key references auth.users(id) on delete cascade,
  email                text not null unique,
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
  -- root ต้องเป็นแอดมินที่ใช้งานอยู่เสมอ
  constraint accounts_root_is_active_admin check (not is_root or (role = 'admin' and status = 'active'))
);

-- root มีได้คนเดียว
create unique index if not exists accounts_single_root on dashboard.accounts (is_root) where is_root;
create index if not exists accounts_status_created on dashboard.accounts (status, created_at desc);

create or replace function dashboard.tg_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists accounts_touch on dashboard.accounts;
create trigger accounts_touch
  before update on dashboard.accounts
  for each row execute function dashboard.tg_touch_updated_at();

-- ----------------------------------------------------------------------------
-- สร้างแถว dashboard.accounts ใน transaction เดียวกับที่ Supabase Auth สร้างผู้ใช้
-- (insert ล้ม = สร้างผู้ใช้ล้มด้วย) เฉพาะผู้ใช้ที่เซิร์ฟเวอร์แดชบอร์ดติดป้าย source = dashboard
-- บทบาท/สถานะใช้ค่าเริ่มต้นเสมอ (user/unverified) — ไม่อ่านจาก metadata จึงสร้างแอดมินผ่านทางนี้ไม่ได้
-- ----------------------------------------------------------------------------
create or replace function dashboard.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.raw_app_meta_data ->> 'source' = 'dashboard' then
    insert into dashboard.accounts (id, email, full_name)
    values (
      new.id,
      lower(new.email),
      coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1))
    );
  end if;
  return new;
end;
$$;

drop trigger if exists dashboard_on_auth_user_created on auth.users;
create trigger dashboard_on_auth_user_created
  after insert on auth.users
  for each row execute function dashboard.handle_new_auth_user();

-- ----------------------------------------------------------------------------
-- ย้าย root ไปบัญชีอื่นที่ใช้งานอยู่ ภายใน transaction เดียว (ไม่มีช่วงที่ root เป็น 0 หรือ 2 คน)
--   DB001 = ไม่พบบัญชี, DB002 = บัญชีไม่ได้อยู่ในสถานะ active
-- ----------------------------------------------------------------------------
create or replace function dashboard.transfer_root(p_new_root uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
begin
  select status into v_status from dashboard.accounts where id = p_new_root for update;
  if not found then
    raise exception 'account not found' using errcode = 'DB001';
  end if;
  if v_status <> 'active' then
    raise exception 'account is not active' using errcode = 'DB002';
  end if;

  update dashboard.accounts set is_root = false where is_root and id <> p_new_root;
  update dashboard.accounts set is_root = true, role = 'admin' where id = p_new_root;
end;
$$;

-- ----------------------------------------------------------------------------
-- สิทธิ์: เฉพาะ service_role (เซิร์ฟเวอร์แดชบอร์ด) — anon/authenticated เข้าไม่ได้เลย
-- ----------------------------------------------------------------------------
alter table dashboard.accounts enable row level security;

revoke all on schema dashboard from public, anon, authenticated;
grant usage on schema dashboard to service_role;

revoke all on all tables in schema dashboard from public, anon, authenticated;
grant select, insert, update, delete on dashboard.accounts to service_role;

revoke all on function dashboard.tg_touch_updated_at() from public, anon, authenticated;
revoke all on function dashboard.handle_new_auth_user() from public, anon, authenticated;
revoke all on function dashboard.transfer_root(uuid) from public, anon, authenticated;
grant execute on function dashboard.transfer_root(uuid) to service_role;
```

- [ ] **Step 2: Create `supabase/dashboard_schema_checks.sql`**

```sql
-- ============================================================================
-- ตรวจ dashboard_schema.sql — รันทั้งไฟล์ใน SQL Editor หลังรัน dashboard_schema.sql
-- ผ่าน = เห็น NOTICE "checks 1-5 passed" และ "check 6 passed"; ไม่ผ่าน = error ขึ้นต้นด้วย FAIL
-- ทุกอย่างอยู่ใน transaction ที่ rollback ตอนท้าย จึงไม่เหลือข้อมูลทดสอบ
-- ============================================================================
begin;

insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-0000-4000-8000-000000000001', 'authenticated', 'authenticated',
   'check-root@example.invalid', '{"source":"dashboard"}', '{"full_name":"Check Root"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-0000-4000-8000-000000000002', 'authenticated', 'authenticated',
   'check-second@example.invalid', '{"source":"dashboard"}', '{"full_name":"Check Second"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaaa-0000-4000-8000-000000000003', 'authenticated', 'authenticated',
   'check-other-app@example.invalid', '{}', '{}', now(), now());

do $$
declare
  r1 constant uuid := 'aaaaaaaa-0000-4000-8000-000000000001';
  r2 constant uuid := 'aaaaaaaa-0000-4000-8000-000000000002';
  r3 constant uuid := 'aaaaaaaa-0000-4000-8000-000000000003';
  v dashboard.accounts%rowtype;
begin
  -- 1. trigger สร้างแถวเฉพาะผู้ใช้ source = dashboard ด้วยค่าเริ่มต้น
  select * into v from dashboard.accounts where id = r1;
  if not found or v.role <> 'user' or v.status <> 'unverified' or v.full_name <> 'Check Root' or v.is_root then
    raise exception 'FAIL 1: trigger row for a dashboard user is wrong: %', row_to_json(v);
  end if;
  if exists (select 1 from dashboard.accounts where id = r3) then
    raise exception 'FAIL 1: trigger created a row for a non-dashboard user';
  end if;

  -- 2. root มีได้คนเดียว
  update dashboard.accounts set role = 'admin', status = 'active', is_root = true where id = r1;
  update dashboard.accounts set role = 'admin', status = 'active' where id = r2;
  begin
    update dashboard.accounts set is_root = true where id = r2;
    raise exception 'FAIL 2: a second root was allowed';
  exception when unique_violation then null;
  end;

  -- 3. root ต้องเป็นแอดมินที่ใช้งานอยู่
  begin
    update dashboard.accounts set status = 'disabled' where id = r1;
    raise exception 'FAIL 3: the root account could be disabled';
  exception when check_violation then null;
  end;

  -- 4. transfer_root ย้าย root และ root เดิมยังเป็นแอดมิน
  perform dashboard.transfer_root(r2);
  if (select is_root from dashboard.accounts where id = r1) or not (select is_root from dashboard.accounts where id = r2) then
    raise exception 'FAIL 4: transfer_root did not move root';
  end if;
  if (select role from dashboard.accounts where id = r1) <> 'admin' then
    raise exception 'FAIL 4: the old root lost its admin role';
  end if;

  -- 5. ย้าย root ไปบัญชีที่ไม่ active ไม่ได้
  update dashboard.accounts set status = 'disabled' where id = r1;
  begin
    perform dashboard.transfer_root(r1);
    raise exception 'FAIL 5: transfer_root accepted a disabled account';
  exception when sqlstate 'DB002' then null;
  end;

  raise notice 'checks 1-5 passed';
end;
$$;

-- 6. anon อ่านตารางไม่ได้
set local role anon;
do $$
begin
  perform 1 from dashboard.accounts limit 1;
  raise exception 'FAIL 6: anon can read dashboard.accounts';
exception when insufficient_privilege then
  raise notice 'check 6 passed';
end;
$$;
reset role;

rollback;
```

- [ ] **Step 3: Create `scripts/lib.mjs`**

```js
// ตัวช่วยของสคริปต์จัดการ root admin — รันด้วย node --env-file=.env.local (ดู package.json)
import { argv, env, exit } from 'node:process'

export function fail(message) {
  console.error(`✗ ${message}`)
  exit(1)
}

const url = env.SUPABASE_URL?.trim().replace(/\/+$/, '')
const key = env.SUPABASE_SERVICE_ROLE_KEY?.trim()
if (!url || !key) fail('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ยังไม่ได้ตั้งค่า (ใส่ใน .env.local)')

// key แบบใหม่ (sb_secret_...) ไม่ใช่ JWT จึงส่งเฉพาะ apikey — เหมือน lib/db/supabase-rest.ts
const keyHeaders = key.startsWith('sb_') ? { apikey: key } : { apikey: key, Authorization: `Bearer ${key}` }
const profile = { 'Accept-Profile': 'dashboard', 'Content-Profile': 'dashboard' }

async function call(path, { method = 'GET', body, headers = {} } = {}) {
  const res = await fetch(`${url}${path}`, {
    method,
    headers: { ...keyHeaders, 'Content-Type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${text}`)
  return text ? JSON.parse(text) : null
}

export const accounts = {
  select: (query) => call(`/rest/v1/accounts?${query}`, { headers: profile }),
  update: (query, patch) =>
    call(`/rest/v1/accounts?${query}`, { method: 'PATCH', body: patch, headers: { ...profile, Prefer: 'return=representation' } }),
  transferRoot: (id) => call('/rest/v1/rpc/transfer_root', { method: 'POST', body: { p_new_root: id }, headers: profile }),
}

export const createAuthUser = (body) => call('/auth/v1/admin/users', { method: 'POST', body })

export function emailArg(command) {
  const email = argv[2]?.trim().toLowerCase()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(`ระบุอีเมล เช่น pnpm run ${command} you@example.com`)
  return email
}
```

- [ ] **Step 4: Create `scripts/create-root-admin.mjs`**

```js
// สร้าง root admin คนแรก: pnpm run create-root-admin you@example.com
import { randomBytes } from 'node:crypto'
import { stdin, stdout } from 'node:process'
import { createInterface } from 'node:readline/promises'
import { accounts, createAuthUser, emailArg, fail } from './lib.mjs'

const email = emailArg('create-root-admin')

const [root] = await accounts.select('is_root=is.true&select=email')
if (root) fail(`มี root admin อยู่แล้ว (${root.email}) — ใช้ pnpm run transfer-root <email> เพื่อย้าย root`)
const [existing] = await accounts.select(`email=eq.${encodeURIComponent(email)}&select=id`)
if (existing) fail(`${email} มีบัญชีอยู่แล้ว — ถ้าบัญชีนั้นใช้งานอยู่ ใช้ pnpm run transfer-root ${email}`)

const rl = createInterface({ input: stdin, output: stdout })
const fullName = (await rl.question('ชื่อ-นามสกุลของ root admin: ')).trim()
rl.close()
if (!fullName) fail('ต้องระบุชื่อ')

const password = randomBytes(15).toString('base64url')
const user = await createAuthUser({
  email,
  password,
  email_confirm: true,
  app_metadata: { source: 'dashboard' },
  user_metadata: { full_name: fullName },
})

// trigger สร้างแถวเป็น user/unverified แล้ว — ยกขึ้นเป็น root admin
try {
  const now = new Date().toISOString()
  const [row] = await accounts.update(`id=eq.${user.id}`, {
    role: 'admin',
    status: 'active',
    is_root: true,
    email_verified_at: now,
    approved_at: now,
  })
  if (!row) throw new Error('ไม่พบแถวใน dashboard.accounts — รัน supabase/dashboard_schema.sql แล้วหรือยัง?')
} catch (err) {
  fail(
    `สร้างผู้ใช้ใน Supabase Auth แล้ว (id ${user.id}) แต่ตั้งเป็น root ไม่สำเร็จ: ${err.message}\n` +
      '  ลบผู้ใช้นี้ที่ Supabase → Authentication → Users แล้วรันใหม่',
  )
}

console.log(`✓ สร้าง root admin ${email} แล้ว`)
console.log(`  รหัสผ่านชั่วคราว (แสดงครั้งเดียว): ${password}`)
console.log('  เข้าสู่ระบบที่ /login แล้วเปลี่ยนรหัสผ่านผ่าน "ลืมรหัสผ่าน"')
```

- [ ] **Step 5: Create `scripts/transfer-root.mjs`**

```js
// ย้าย root admin ไปบัญชีอื่นที่ใช้งานอยู่: pnpm run transfer-root new-root@example.com
import { accounts, emailArg, fail } from './lib.mjs'

const email = emailArg('transfer-root')
const [account] = await accounts.select(`email=eq.${encodeURIComponent(email)}&select=id,status,is_root`)
if (!account) fail(`ไม่พบบัญชี ${email}`)
if (account.is_root) fail(`${email} เป็น root อยู่แล้ว`)
if (account.status !== 'active') fail(`${email} ยังไม่ได้อยู่ในสถานะใช้งาน (status: ${account.status})`)

await accounts.transferRoot(account.id)
console.log(`✓ ย้าย root ไปที่ ${email} แล้ว (root เดิมยังเป็นแอดมิน)`)
```

- [ ] **Step 6: Add the package scripts**

In `package.json` `"scripts"` add:

```json
    "create-root-admin": "node --env-file=.env.local scripts/create-root-admin.mjs",
    "transfer-root": "node --env-file=.env.local scripts/transfer-root.mjs"
```

- [ ] **Step 7: Verify the scripts parse and fail cleanly without arguments**

Run: `node --check scripts/lib.mjs && node --check scripts/create-root-admin.mjs && node --check scripts/transfer-root.mjs && echo syntax-ok`
Expected: `syntax-ok`

Run: `SUPABASE_URL= SUPABASE_SERVICE_ROLE_KEY= node scripts/transfer-root.mjs; echo "exit=$?"`
Expected: `✗ SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ยังไม่ได้ตั้งค่า (ใส่ใน .env.local)` and `exit=1`.

- [ ] **Step 8: Commit**

```bash
git add supabase/dashboard_schema.sql supabase/dashboard_schema_checks.sql scripts package.json
git commit -m "feat: Add dashboard schema SQL and root admin scripts

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Client helpers and auth pages

**Files:**
- Create: `lib/auth-client.ts`
- Create: `lib/use-session.ts`
- Create: `components/auth/AuthCard.tsx`
- Rewrite: `app/login/page.tsx`
- Create: `app/signup/page.tsx`, `app/verify-email/page.tsx`, `app/forgot-password/page.tsx`, `app/reset-password/page.tsx`
- Rewrite: `app/admin/login/page.tsx` (redirect)

**Interfaces:**
- Consumes: HTTP APIs from Tasks 7–8; `safeNext`, `Role` (policy); `SessionAccount` type (session.ts — type-only import).
- Produces:
  - `postJson<T>(url: string, body?: unknown, method?: string): Promise<{ ok: boolean; status: number; data: T & { error?: string } }>`
  - `queryParam(name: string): string | null`, `redirectToLogin(): void`, `handleAuthFailure(status: number): boolean`
  - `useSession(need: 'signed-in' | 'admin'): { account: SessionAccount | null; logout: () => Promise<void> }`; re-exports `type SessionAccount`
  - `AuthCard`, `AuthField`, `AuthButton`, `AuthNotice`, `authLinkStyle`

The repo has no UI test setup, so these steps are verified by `pnpm build` (Task 14) and the manual walk-through. Read query strings with `window.location.search` inside effects/handlers (as the current `app/admin/login/page.tsx` does) so pages don't need a Suspense boundary for `useSearchParams`.

- [ ] **Step 1: Create `lib/auth-client.ts`**

```ts
/** ตัวช่วยฝั่งเบราว์เซอร์ของระบบบัญชี (ไม่มีโค้ดฝั่งเซิร์ฟเวอร์) */

export async function postJson<T = Record<string, unknown>>(
  url: string,
  body?: unknown,
  method = 'POST',
): Promise<{ ok: boolean; status: number; data: T & { error?: string } }> {
  try {
    const res = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    return { ok: res.ok, status: res.status, data }
  } catch {
    return { ok: false, status: 0, data: { error: 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่' } as T & { error?: string } }
  }
}

export const queryParam = (name: string) => new URLSearchParams(window.location.search).get(name)

/** ไปหน้าเข้าสู่ระบบ แล้วกลับมาหน้าเดิมหลังล็อกอิน */
export function redirectToLogin() {
  window.location.href = `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`
}

/** 401 → หน้าเข้าสู่ระบบ, 403 → แดชบอร์ดผู้ใช้ (ไม่ใช่แอดมิน); true = จัดการแล้ว */
export function handleAuthFailure(status: number): boolean {
  if (status === 401) {
    redirectToLogin()
    return true
  }
  if (status === 403) {
    window.location.href = '/map'
    return true
  }
  return false
}
```

- [ ] **Step 2: Create `lib/use-session.ts`**

```ts
'use client'

import { useCallback, useEffect, useState } from 'react'
import type { SessionAccount } from '@/lib/auth/session'
import { redirectToLogin } from '@/lib/auth-client'

export type { SessionAccount }

/**
 * บัญชีที่ล็อกอินอยู่ — ยังไม่ล็อกอินจะถูกส่งไป /login, ผู้ใช้ทั่วไปที่เปิดหน้าแอดมินจะถูกส่งไป /map
 * (แค่เพื่อประสบการณ์ใช้งาน — API ทุกตัวตรวจสิทธิ์เองอีกชั้น)
 */
export function useSession(need: 'signed-in' | 'admin') {
  const [account, setAccount] = useState<SessionAccount | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/auth/session', { cache: 'no-store' })
      .then(async (res) => {
        if (cancelled) return
        if (!res.ok) return redirectToLogin()
        const { account } = (await res.json()) as { account: SessionAccount }
        if (need === 'admin' && account.role !== 'admin') return window.location.replace('/map')
        setAccount(account)
      })
      .catch(() => !cancelled && redirectToLogin())
    return () => {
      cancelled = true
    }
  }, [need])

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    window.location.href = '/login'
  }, [])

  return { account, logout }
}
```

- [ ] **Step 3: Create `components/auth/AuthCard.tsx`**

```tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'
import { fontStyle } from '@/lib/design-tokens'

/** ชิ้นส่วน UI ของหน้าเข้าสู่ระบบ/สมัคร/ลืมรหัสผ่าน (การ์ดเขียวแบบหน้า /login เดิม) */

const GREEN = '#154212'

export const authLinkStyle = { color: GREEN, fontWeight: 600, textDecoration: 'underline' } as const

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="flex items-center justify-center" style={{ minHeight: '100vh', backgroundColor: '#f4f7f4', padding: 16, ...fontStyle }}>
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 16,
          padding: '36px 32px',
          width: '100%',
          maxWidth: 440,
          boxShadow: '0 4px 32px rgba(21,66,18,0.10)',
          display: 'flex',
          flexDirection: 'column',
          gap: 22,
        }}
      >
        <div className="flex flex-col items-center" style={{ gap: 10 }}>
          <Link href="/" aria-label="หน้าหลัก">
            <Image src="/logo-mascot.png" alt="โลโก้" width={64} height={78} priority style={{ objectFit: 'contain' }} />
          </Link>
          <h1 style={{ color: GREEN, fontSize: 24, fontWeight: 700, margin: 0, textAlign: 'center' }}>{title}</h1>
          {subtitle && <p style={{ color: '#6b7280', fontSize: 14, margin: 0, textAlign: 'center' }}>{subtitle}</p>}
        </div>
        {children}
        {footer && (
          <div className="flex flex-col items-center" style={{ gap: 6, color: '#6b7280', fontSize: 14 }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export function AuthField({ label, ...input }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, color: GREEN, fontSize: 14, fontWeight: 600 }}>
      {label}
      <input
        {...input}
        style={{ border: '1.5px solid #d1d5db', borderRadius: 8, padding: '10px 14px', fontSize: 15, color: GREEN, ...fontStyle }}
      />
    </label>
  )
}

export function AuthButton({
  busy = false,
  variant = 'solid',
  children,
  ...rest
}: { busy?: boolean; variant?: 'solid' | 'outline'; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const solid = variant === 'solid'
  return (
    <button
      type={solid ? 'submit' : 'button'}
      disabled={busy || rest.disabled}
      {...rest}
      style={{
        backgroundColor: solid ? GREEN : '#ffffff',
        color: solid ? '#ffffff' : GREEN,
        border: `1.5px solid ${GREEN}`,
        borderRadius: 8,
        padding: 12,
        fontSize: 15,
        fontWeight: 600,
        cursor: busy ? 'not-allowed' : 'pointer',
        opacity: busy ? 0.7 : 1,
        ...fontStyle,
      }}
    >
      {children}
    </button>
  )
}

export function AuthNotice({ tone, children }: { tone: 'error' | 'info'; children: ReactNode }) {
  const c = tone === 'error' ? { bg: '#fdecea', fg: '#b02e0d' } : { bg: '#e8f3e6', fg: GREEN }
  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      style={{ margin: 0, padding: '10px 12px', borderRadius: 8, backgroundColor: c.bg, color: c.fg, fontSize: 14, fontWeight: 600 }}
    >
      {children}
    </p>
  )
}
```

- [ ] **Step 4: Rewrite `app/login/page.tsx`**

Replace the whole file:

```tsx
'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'
import { AuthButton, AuthCard, AuthField, AuthNotice, authLinkStyle } from '@/components/auth/AuthCard'
import { postJson, queryParam } from '@/lib/auth-client'
import { safeNext, type Role } from '@/lib/auth/policy'

const NOTICES: Record<string, string> = {
  verified: 'ยืนยันอีเมลแล้ว คำขอของคุณถูกส่งให้ผู้ดูแลระบบพิจารณา เราจะแจ้งทางอีเมลเมื่ออนุมัติ',
  reset: 'ตั้งรหัสผ่านใหม่แล้ว เข้าสู่ระบบด้วยรหัสผ่านใหม่ได้เลย',
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [unverified, setUnverified] = useState(false)

  useEffect(() => {
    const notice = queryParam('notice')
    if (notice && NOTICES[notice]) setInfo(NOTICES[notice])
    // ล็อกอินค้างอยู่แล้ว → ไปหน้าที่ควรไปเลย
    fetch('/api/auth/session', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((s: { account: { role: Role } } | null) => {
        if (s) window.location.replace(safeNext(queryParam('next'), s.account.role))
      })
      .catch(() => {})
  }, [])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setInfo(null)
    setUnverified(false)
    const { ok, data } = await postJson<{ redirect?: string; reason?: string }>('/api/auth/login', {
      email,
      password,
      next: queryParam('next'),
    })
    if (ok && data.redirect) {
      // โหลดใหม่ทั้งหน้า เพื่อให้ cookie เซสชันถูกใช้กับทุกคำขอ
      window.location.href = data.redirect
      return
    }
    setError(data.error || 'เข้าสู่ระบบไม่สำเร็จ')
    setUnverified(data.reason === 'unverified')
    setBusy(false)
  }

  const resend = async () => {
    await postJson('/api/auth/resend-verification', { email })
    setUnverified(false)
    setError(null)
    setInfo('ส่งลิงก์ยืนยันอีกครั้งแล้ว ถ้ายังไม่ได้รับ ให้รอ 1 นาทีแล้วลองใหม่')
  }

  return (
    <AuthCard
      title="เข้าสู่ระบบ"
      subtitle="ระบบข้อมูลร่วมอนุรักษ์โลก คุ้งบางกะเจ้า"
      footer={
        <>
          <Link href="/forgot-password" style={authLinkStyle}>
            ลืมรหัสผ่าน?
          </Link>
          <span>
            ยังไม่มีบัญชี?{' '}
            <Link href="/signup" style={authLinkStyle}>
              สมัครใช้งาน
            </Link>
          </span>
        </>
      }
    >
      {info && <AuthNotice tone="info">{info}</AuthNotice>}
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <AuthField label="อีเมล" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <AuthField
          label="รหัสผ่าน"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <AuthNotice tone="error">{error}</AuthNotice>}
        {unverified && (
          <AuthButton variant="outline" onClick={resend}>
            ส่งลิงก์ยืนยันอีเมลอีกครั้ง
          </AuthButton>
        )}
        <AuthButton busy={busy}>{busy ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}</AuthButton>
      </form>
    </AuthCard>
  )
}
```

- [ ] **Step 5: Create `app/signup/page.tsx`**

```tsx
'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { AuthButton, AuthCard, AuthField, AuthNotice, authLinkStyle } from '@/components/auth/AuthCard'
import { postJson } from '@/lib/auth-client'
import { PASSWORD_MIN_LENGTH } from '@/lib/auth/policy'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<{ emailSent: boolean } | null>(null)
  const [resent, setResent] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (password !== confirm) return setError('รหัสผ่านทั้งสองช่องไม่ตรงกัน')
    setBusy(true)
    setError(null)
    const { ok, data } = await postJson<{ emailSent?: boolean }>('/api/auth/signup', { fullName, email, password })
    setBusy(false)
    if (ok) setDone({ emailSent: !!data.emailSent })
    else setError(data.error || 'สมัครใช้งานไม่สำเร็จ')
  }

  const resend = async () => {
    await postJson('/api/auth/resend-verification', { email })
    setResent(true)
  }

  const backToLogin = (
    <Link href="/login" style={authLinkStyle}>
      กลับไปหน้าเข้าสู่ระบบ
    </Link>
  )

  if (done) {
    return (
      <AuthCard title="ตรวจสอบอีเมลของคุณ" footer={backToLogin}>
        {done.emailSent ? (
          <AuthNotice tone="info">
            เราส่งลิงก์ยืนยันไปที่ {email} แล้ว กดลิงก์ภายใน 24 ชั่วโมง จากนั้นผู้ดูแลระบบจะพิจารณาอนุมัติบัญชีและแจ้งผลทางอีเมล
          </AuthNotice>
        ) : (
          <AuthNotice tone="error">สร้างบัญชีแล้ว แต่ส่งอีเมลยืนยันไม่สำเร็จ กดปุ่มด้านล่างเพื่อส่งอีกครั้ง</AuthNotice>
        )}
        {resent && <AuthNotice tone="info">ส่งอีกครั้งแล้ว ถ้ายังไม่ได้รับ ให้รอ 1 นาทีแล้วลองใหม่</AuthNotice>}
        <AuthButton variant="outline" onClick={resend}>
          ส่งลิงก์ยืนยันอีกครั้ง
        </AuthButton>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="สมัครใช้งานแดชบอร์ด"
      subtitle="หลังยืนยันอีเมล ผู้ดูแลระบบจะพิจารณาอนุมัติบัญชีของคุณ"
      footer={
        <span>
          มีบัญชีแล้ว?{' '}
          <Link href="/login" style={authLinkStyle}>
            เข้าสู่ระบบ
          </Link>
        </span>
      }
    >
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <AuthField label="ชื่อ-นามสกุล" autoComplete="name" required maxLength={100} value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <AuthField label="อีเมล" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <AuthField
          label={`รหัสผ่าน (อย่างน้อย ${PASSWORD_MIN_LENGTH} ตัวอักษร)`}
          type="password"
          autoComplete="new-password"
          required
          minLength={PASSWORD_MIN_LENGTH}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <AuthField
          label="ยืนยันรหัสผ่าน"
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {error && <AuthNotice tone="error">{error}</AuthNotice>}
        <AuthButton busy={busy}>{busy ? 'กำลังสมัคร...' : 'สมัครใช้งาน'}</AuthButton>
      </form>
    </AuthCard>
  )
}
```

- [ ] **Step 6: Create `app/verify-email/page.tsx`**

```tsx
'use client'

import Link from 'next/link'
import { useState } from 'react'
import { AuthButton, AuthCard, AuthNotice, authLinkStyle } from '@/components/auth/AuthCard'
import { postJson, queryParam } from '@/lib/auth-client'

/** ลิงก์ในอีเมลพามาที่นี่ — ต้องกดปุ่มเอง (POST) ตัวสแกนลิงก์ในอีเมลจึงยืนยันแทนไม่ได้ */
export default function VerifyEmailPage() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const confirm = async () => {
    setBusy(true)
    setError(null)
    const { ok, data } = await postJson('/api/auth/verify-email', { token: queryParam('token') ?? '' })
    if (ok) {
      window.location.href = '/login?notice=verified'
      return
    }
    setError(data.error || 'ยืนยันอีเมลไม่สำเร็จ')
    setBusy(false)
  }

  return (
    <AuthCard
      title="ยืนยันอีเมล"
      subtitle="กดปุ่มด้านล่างเพื่อยืนยันอีเมลและส่งคำขอเปิดบัญชีให้ผู้ดูแลระบบ"
      footer={
        <span>
          ลิงก์หมดอายุ?{' '}
          <Link href="/signup" style={authLinkStyle}>
            สมัครอีกครั้งด้วยอีเมลเดิม
          </Link>
        </span>
      }
    >
      {error && <AuthNotice tone="error">{error}</AuthNotice>}
      <AuthButton busy={busy} type="button" onClick={confirm}>
        {busy ? 'กำลังยืนยัน...' : 'ยืนยันอีเมล'}
      </AuthButton>
    </AuthCard>
  )
}
```

- [ ] **Step 7: Create `app/forgot-password/page.tsx`**

```tsx
'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { AuthButton, AuthCard, AuthField, AuthNotice, authLinkStyle } from '@/components/auth/AuthCard'
import { postJson } from '@/lib/auth-client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { ok, data } = await postJson('/api/auth/forgot-password', { email })
    setBusy(false)
    if (ok) setSent(true)
    else setError(data.error || 'ส่งคำขอไม่สำเร็จ')
  }

  return (
    <AuthCard
      title="ลืมรหัสผ่าน"
      subtitle="กรอกอีเมลของบัญชี เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ให้"
      footer={
        <Link href="/login" style={authLinkStyle}>
          กลับไปหน้าเข้าสู่ระบบ
        </Link>
      }
    >
      {sent ? (
        <AuthNotice tone="info">ถ้ามีบัญชีที่ใช้อีเมลนี้ เราได้ส่งลิงก์ตั้งรหัสผ่านใหม่ไปแล้ว (ใช้ได้ภายใน 1 ชั่วโมง)</AuthNotice>
      ) : (
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <AuthField label="อีเมล" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          {error && <AuthNotice tone="error">{error}</AuthNotice>}
          <AuthButton busy={busy}>{busy ? 'กำลังส่ง...' : 'ส่งลิงก์ตั้งรหัสผ่านใหม่'}</AuthButton>
        </form>
      )}
    </AuthCard>
  )
}
```

- [ ] **Step 8: Create `app/reset-password/page.tsx`**

```tsx
'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { AuthButton, AuthCard, AuthField, AuthNotice, authLinkStyle } from '@/components/auth/AuthCard'
import { postJson, queryParam } from '@/lib/auth-client'
import { PASSWORD_MIN_LENGTH } from '@/lib/auth/policy'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (password !== confirm) return setError('รหัสผ่านทั้งสองช่องไม่ตรงกัน')
    setBusy(true)
    setError(null)
    const { ok, data } = await postJson('/api/auth/reset-password', { token: queryParam('token') ?? '', password })
    if (ok) {
      window.location.href = '/login?notice=reset'
      return
    }
    setError(data.error || 'ตั้งรหัสผ่านใหม่ไม่สำเร็จ')
    setBusy(false)
  }

  return (
    <AuthCard
      title="ตั้งรหัสผ่านใหม่"
      footer={
        <Link href="/forgot-password" style={authLinkStyle}>
          ขอลิงก์ใหม่
        </Link>
      }
    >
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <AuthField
          label={`รหัสผ่านใหม่ (อย่างน้อย ${PASSWORD_MIN_LENGTH} ตัวอักษร)`}
          type="password"
          autoComplete="new-password"
          required
          minLength={PASSWORD_MIN_LENGTH}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <AuthField
          label="ยืนยันรหัสผ่านใหม่"
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {error && <AuthNotice tone="error">{error}</AuthNotice>}
        <AuthButton busy={busy}>{busy ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่'}</AuthButton>
      </form>
    </AuthCard>
  )
}
```

- [ ] **Step 9: Rewrite `app/admin/login/page.tsx` as a redirect**

Replace the whole file:

```tsx
import { redirect } from 'next/navigation'

/** หน้าเข้าสู่ระบบแอดมินเดิม — รวมกับ /login แล้ว (คงไว้ให้ลิงก์/บุ๊กมาร์กเก่ายังใช้ได้) */
export default async function AdminLoginRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { next } = await searchParams
  redirect(typeof next === 'string' ? `/login?next=${encodeURIComponent(next)}` : '/login')
}
```

- [ ] **Step 10: Commit**

```bash
git add lib/auth-client.ts lib/use-session.ts components/auth app/login/page.tsx app/signup app/verify-email app/forgot-password app/reset-password app/admin/login/page.tsx
git commit -m "feat: Add login, sign-up and password reset pages

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Admin shell and account management page

**Files:**
- Rewrite: `components/dashboard/AdminShell.tsx`
- Create: `app/admin/accounts/page.tsx`
- Modify: `components/dashboard/AdminSidebar.tsx` (menu item)

**Interfaces:**
- Consumes: `useSession`, `SessionAccount` (Task 11); `postJson`; `AccountListItem` (type-only); `ACCOUNT_STATUSES`, `ROLE_LABELS`, `STATUS_LABELS`, `Role`, `AccountStatus` (policy); `useAdminList`, `toBuDateTime`; admin-ui components.
- Produces: `useCurrentAccount(): SessionAccount | null` exported from `AdminShell.tsx` (only valid inside `<AdminShell>`).

- [ ] **Step 1: Rewrite `components/dashboard/AdminShell.tsx`**

Replace the whole file:

```tsx
'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import Image from 'next/image'
import AdminSidebar from '@/components/dashboard/AdminSidebar'
import { useSession, type SessionAccount } from '@/lib/use-session'
import { fontStyle } from '@/lib/design-tokens'
import { ADMIN_COLORS } from '@/lib/admin-tokens'

const CurrentAccountContext = createContext<SessionAccount | null>(null)

/** บัญชีแอดมินที่ล็อกอินอยู่ — ใช้ได้ในคอมโพเนนต์ที่อยู่ภายใน AdminShell */
export const useCurrentAccount = () => useContext(CurrentAccountContext)

/**
 * โครงหน้าแอดมิน: sidebar + header (โปรไฟล์/โลโก้) + เนื้อหา
 * ตรวจการล็อกอินจาก /api/auth/session — ผู้ใช้ที่ไม่ใช่แอดมินจะถูกส่งไปหน้าแดชบอร์ดผู้ใช้
 */
export default function AdminShell({
  activeHref,
  children,
}: {
  activeHref: string
  children: ReactNode
}) {
  const { account, logout } = useSession('admin')
  const [profileOpen, setProfileOpen] = useState(false)

  if (!account) return null

  return (
    <div className="flex" style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <AdminSidebar activeHref={activeHref} />

      <div className="flex flex-col" style={{ flex: 1, minWidth: 0 }}>
        <div
          className="flex items-center justify-between"
          style={{
            height: 49,
            backgroundColor: '#ffffff',
            borderBottom: `1px solid ${ADMIN_COLORS.border}`,
            padding: '0 20px',
            flexShrink: 0,
          }}
        >
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center"
              style={{ gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  backgroundColor: ADMIN_COLORS.navyHeader,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: 14,
                  fontWeight: 700,
                  ...fontStyle,
                }}
              >
                {account.fullName.charAt(0)}
              </div>
              <span style={{ color: ADMIN_COLORS.navy, fontSize: 14, fontWeight: 600, ...fontStyle }}>{account.fullName}</span>
            </button>

            {profileOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '120%',
                  left: 0,
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: 10,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                  minWidth: 220,
                  zIndex: 50,
                  overflow: 'hidden',
                }}
              >
                <p style={{ margin: 0, padding: '10px 16px', color: '#6b7280', fontSize: 13, borderBottom: '1px solid #f3f4f6', ...fontStyle }}>
                  {account.email}
                </p>
                <button
                  onClick={logout}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '10px 16px',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: ADMIN_COLORS.navy,
                    fontSize: 14,
                    fontWeight: 600,
                    ...fontStyle,
                  }}
                >
                  ออกจากระบบ
                </button>
              </div>
            )}
          </div>

          <Image src="/mascot-icon.png" alt="โลโก้" width={26} height={32} />
        </div>

        <main style={{ padding: '0 20px 30px', display: 'flex', flexDirection: 'column' }}>
          <CurrentAccountContext.Provider value={account}>{children}</CurrentAccountContext.Provider>
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add the sidebar item in `components/dashboard/AdminSidebar.tsx`**

In `ITEM_HREFS`, after `'Admin / เจ้าหน้าที่': '/admin/staff',` add:

```ts
  บัญชีแดชบอร์ด: '/admin/accounts',
```

In `MENU`, change the `จัดการเจ้าหน้าที่` group to:

```ts
  { title: 'จัดการเจ้าหน้าที่', items: ['Admin / เจ้าหน้าที่', 'บัญชีแดชบอร์ด', 'สิทธิ์การเข้าถึง', 'การมอบหมายพื้นที่'] },
```

- [ ] **Step 3: Create `app/admin/accounts/page.tsx`**

```tsx
'use client'

import { useState, type ReactNode } from 'react'
import AdminShell, { useCurrentAccount } from '@/components/dashboard/AdminShell'
import {
  Badge,
  Column,
  DataTable,
  PageTitle,
  PlainSelect,
  SearchInput,
  STATUS_COLORS,
  outlineBtn,
  solidBtn,
} from '@/components/dashboard/admin-ui'
import { postJson } from '@/lib/auth-client'
import type { AccountListItem } from '@/lib/auth/accounts'
import { ACCOUNT_STATUSES, ROLE_LABELS, STATUS_LABELS, type AccountStatus, type Role } from '@/lib/auth/policy'
import { PAGE_SIZE } from '@/lib/db/constants'
import { toBuDateTime, useAdminList } from '@/lib/use-admin-list'

type Tab = 'pending' | 'all'
type Command = { action: 'approve' | 'set-role'; role: Role } | { action: 'reject' | 'disable' | 'enable' } | 'delete'

const ALL_STATUSES = 'ทุกสถานะ'

const STATUS_BADGE: Record<AccountStatus, { color: string; text?: string }> = {
  unverified: { color: '#8a8fa0' },
  pending: { color: STATUS_COLORS.yellow, text: '#222222' },
  active: { color: STATUS_COLORS.green },
  disabled: { color: STATUS_COLORS.red },
}

const smallBtn = { height: 32, padding: '0 12px', fontSize: 13 } as const
const muted = { color: '#8a8fa0', fontSize: 13 } as const

function RowActions({
  row,
  meId,
  busy,
  onCommand,
}: {
  row: AccountListItem
  meId: string | undefined
  busy: boolean
  onCommand: (row: AccountListItem, command: Command) => void
}) {
  if (row.is_root) return <span style={muted}>บัญชี root</span>
  if (row.id === meId) return <span style={muted}>บัญชีของคุณ</span>

  const button = (label: string, command: Command, solid = false) => (
    <button
      key={label}
      type="button"
      disabled={busy}
      onClick={() => onCommand(row, command)}
      style={{ ...(solid ? solidBtn : outlineBtn), ...smallBtn, opacity: busy ? 0.5 : 1 }}
    >
      {label}
    </button>
  )

  const byStatus: Record<AccountStatus, ReactNode[]> = {
    pending: [
      button('อนุมัติเป็นผู้ใช้', { action: 'approve', role: 'user' }, true),
      button('อนุมัติเป็นแอดมิน', { action: 'approve', role: 'admin' }),
      button('ปฏิเสธ', { action: 'reject' }),
    ],
    active: [
      row.role === 'admin'
        ? button('เปลี่ยนเป็นผู้ใช้', { action: 'set-role', role: 'user' })
        : button('ตั้งเป็นแอดมิน', { action: 'set-role', role: 'admin' }),
      button('ปิดใช้งาน', { action: 'disable' }),
    ],
    disabled: [button('เปิดใช้งาน', { action: 'enable' })],
    unverified: [],
  }

  return (
    <div className="flex" style={{ gap: 6 }}>
      {byStatus[row.status]}
      {button('ลบ', 'delete')}
    </div>
  )
}

function AccountsView() {
  const me = useCurrentAccount()
  const [tab, setTab] = useState<Tab>('pending')
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState(ALL_STATUSES)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)

  const status = tab === 'pending' ? 'pending' : ACCOUNT_STATUSES.find((s) => STATUS_LABELS[s] === statusFilter)
  const list = useAdminList<AccountListItem>('/api/admin/accounts', {
    page,
    pageSize: PAGE_SIZE,
    status,
    q: tab === 'all' ? q : undefined,
  })

  const run = async (row: AccountListItem, command: Command) => {
    if (command === 'delete' && !window.confirm(`ลบบัญชี ${row.email} ถาวร? ย้อนกลับไม่ได้`)) return
    setBusyId(row.id)
    setMessage(null)
    const url = `/api/admin/accounts/${row.id}`
    const res =
      command === 'delete'
        ? await postJson(url, undefined, 'DELETE')
        : await postJson<{ emailSent?: boolean }>(url, command, 'PATCH')
    setBusyId(null)
    if (!res.ok) {
      setMessage({ tone: 'error', text: res.data.error || 'ทำรายการไม่สำเร็จ' })
    } else if ((res.data as { emailSent?: boolean }).emailSent === false) {
      setMessage({ tone: 'error', text: `บันทึกแล้ว แต่ส่งอีเมลแจ้ง ${row.email} ไม่สำเร็จ` })
    } else {
      setMessage({ tone: 'ok', text: 'บันทึกแล้ว' })
    }
    list.reload()
  }

  const columns: Column<AccountListItem>[] = [
    { key: 'full_name', label: 'ชื่อ' },
    { key: 'email', label: 'อีเมล' },
    {
      key: 'role',
      label: 'บทบาท',
      render: (r) => (
        <span className="flex items-center" style={{ gap: 6 }}>
          {ROLE_LABELS[r.role]}
          {r.is_root && <Badge color={STATUS_COLORS.navy}>root</Badge>}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'สถานะ',
      render: (r) => (
        <Badge color={STATUS_BADGE[r.status].color} textColor={STATUS_BADGE[r.status].text}>
          {STATUS_LABELS[r.status]}
        </Badge>
      ),
    },
    { key: 'created_at', label: 'วันที่สมัคร', render: (r) => toBuDateTime(r.created_at) },
    {
      key: 'actions',
      label: 'จัดการ',
      render: (r) => <RowActions row={r} meId={me?.id} busy={busyId === r.id} onCommand={run} />,
    },
  ]

  return (
    <>
      <PageTitle title="บัญชีแดชบอร์ด" subtitle="อนุมัติและจัดการบัญชีที่ใช้เข้าสู่ระบบแดชบอร์ดนี้" />

      <div className="flex" style={{ gap: 10, marginBottom: 12 }}>
        {(['pending', 'all'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTab(t)
              setPage(1)
            }}
            style={tab === t ? solidBtn : outlineBtn}
          >
            {t === 'pending' ? 'รออนุมัติ' : 'บัญชีทั้งหมด'}
          </button>
        ))}
      </div>

      {tab === 'all' && (
        <div className="flex items-center justify-between" style={{ gap: 20, marginBottom: 12 }}>
          <SearchInput
            value={q}
            onChange={(v) => {
              setQ(v)
              setPage(1)
            }}
            placeholder="ค้นหาชื่อหรืออีเมล"
          />
          <PlainSelect
            label="สถานะ"
            value={statusFilter}
            options={[ALL_STATUSES, ...ACCOUNT_STATUSES.map((s) => STATUS_LABELS[s])]}
            onChange={(v) => {
              setStatusFilter(v)
              setPage(1)
            }}
          />
        </div>
      )}

      {message && (
        <p role={message.tone === 'error' ? 'alert' : 'status'} style={{ color: message.tone === 'error' ? '#b02e0d' : '#154212', fontWeight: 600 }}>
          {message.text}
        </p>
      )}
      {list.error && (
        <p role="alert" style={{ color: '#b02e0d', fontWeight: 600 }}>
          โหลดข้อมูลไม่สำเร็จ: {list.error}
        </p>
      )}

      <div style={{ opacity: list.loading ? 0.6 : 1, transition: 'opacity .15s' }}>
        <DataTable
          columns={columns}
          rows={list.rows}
          rowKey={(r) => r.id}
          total={list.total}
          pageSize={PAGE_SIZE}
          pageCount={Math.max(1, Math.ceil(list.total / PAGE_SIZE))}
          page={page}
          onPage={setPage}
        />
      </div>
    </>
  )
}

export default function AccountsPage() {
  return (
    <AdminShell activeHref="/admin/accounts">
      <AccountsView />
    </AdminShell>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/AdminShell.tsx components/dashboard/AdminSidebar.tsx app/admin/accounts
git commit -m "feat: Add dashboard account management page for admins

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: Wire user pages, remove the old login, update config

**Files:**
- Create: `components/dashboard/UserAccountMenu.tsx`
- Modify: `app/map/page.tsx`, `app/waste-types/page.tsx`
- Modify: `lib/use-admin-list.ts`, `lib/use-dashboard.ts`
- Modify: `app/layout.tsx`, `lib/site.ts`, `.env.example`, `package.json`
- Delete: `lib/auth-context.tsx`, `lib/liff-context.tsx`, `lib/db/admin-session.ts`, `app/api/admin/login/route.ts`, `app/api/admin/logout/route.ts`, `app/api/admin/session/route.ts`

**Interfaces:**
- Consumes: `useSession`, `SessionAccount` (Task 11); `handleAuthFailure` (Task 11).
- Produces: `UserAccountMenu({ account: SessionAccount; onLogout: () => void })` default export.

- [ ] **Step 1: Create `components/dashboard/UserAccountMenu.tsx`**

```tsx
'use client'

import Link from 'next/link'
import { useState } from 'react'
import { fontStyle } from '@/lib/design-tokens'
import type { SessionAccount } from '@/lib/use-session'

const GREEN = '#154212'

/** เมนูบัญชีมุมขวาบนของหน้าแดชบอร์ดผู้ใช้ (ชื่อ, อีเมล, ไปหน้าแอดมิน, ออกจากระบบ) */
export default function UserAccountMenu({ account, onLogout }: { account: SessionAccount; onLogout: () => void }) {
  const [open, setOpen] = useState(false)
  const item = {
    display: 'block',
    width: '100%',
    padding: '10px 16px',
    textAlign: 'left',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
    textDecoration: 'none',
    ...fontStyle,
  } as const

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center"
        style={{ gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: 8 }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            backgroundColor: GREEN,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: '#ffffff',
            fontSize: 15,
            fontWeight: 700,
            ...fontStyle,
          }}
        >
          {account.fullName.charAt(0)}
        </div>
        <span
          style={{
            color: GREEN,
            fontSize: 14,
            fontWeight: 600,
            maxWidth: 160,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            ...fontStyle,
          }}
        >
          {account.fullName}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2.5" aria-hidden>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '110%',
            right: 0,
            backgroundColor: '#ffffff',
            border: '1.5px solid #e5e7eb',
            borderRadius: 10,
            boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
            minWidth: 200,
            zIndex: 50,
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', textAlign: 'center', ...fontStyle }}>
            <p style={{ color: GREEN, fontSize: 14, fontWeight: 700, margin: 0 }}>{account.fullName}</p>
            <p style={{ color: '#9ca3af', fontSize: 12, margin: '2px 0 0' }}>{account.email}</p>
          </div>
          {account.role === 'admin' && (
            <Link href="/admin/dashboard" style={{ ...item, color: GREEN }}>
              ไปหน้าแอดมิน
            </Link>
          )}
          <button onClick={onLogout} style={{ ...item, color: '#c06060' }}>
            ออกจากระบบ
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Rewire `app/map/page.tsx`**

Line numbers below refer to the file as it is before this task. Apply the edits bottom-up (or match by the quoted content) so earlier edits don't shift later line numbers.

1. Replace lines 3–5 (`useState, useEffect` / `useRouter` / `Image` imports) with:

```ts
import { useState } from 'react'
```

2. Replace lines 14–15 (`useAuth`, `useLiff` imports) with:

```ts
import UserAccountMenu from '@/components/dashboard/UserAccountMenu'
import { useSession } from '@/lib/use-session'
```

3. Replace everything from `const router = useRouter()` down to and including the `handleLogout` function (lines 23–49) with:

```ts
  const { account, logout } = useSession('signed-in')
  const [selectedTambon, setSelectedTambon] = useState('บางกะเจ้า')

  if (!account) return null
```

4. In the header, replace the block that starts at the comment `{/* User profile top-right */}` and ends with the `</div>` that closes `<div style={{ position: 'relative' }}>` (the line just before the header's own closing `</div>`) with:

```tsx
          <UserAccountMenu account={account} onLogout={logout} />
```

5. Run: `grep -nE "useAuth|useLiff|liff|emailUser|router|profileOpen|avatarUrl|displayName|Image" app/map/page.tsx`
Expected: no output.

- [ ] **Step 3: Rewire `app/waste-types/page.tsx`**

Same rule: line numbers are from the original file; apply bottom-up or match by content.

1. Keep line 3 (`useState, useEffect, useMemo, useCallback` are all still used). Delete lines 4–5 (`useRouter`, `Image`) and lines 8–9 (`useAuth`, `useLiff`). Add:

```ts
import UserAccountMenu from '@/components/dashboard/UserAccountMenu'
import { useSession } from '@/lib/use-session'
```

2. Replace lines 46–48 (`router`, `useAuth`, `useLiff`) with:

```ts
  const { account, logout } = useSession('signed-in')
```

3. Delete the `profileOpen` state line, the `isAuthenticated` line, and the effect that pushes to `/login` (lines 53, 58, 60–62).

4. Change the data-loading effect (lines 80–84) to load once signed in:

```ts
  useEffect(() => {
    if (account) fetchWasteRecords()
  }, [account, fetchWasteRecords])
```

5. Delete the effect commented `// ดึงตำบลของผู้ใช้จาก rawRecords` (lines 86–96). It matched a LINE user id to records; dashboard accounts have no LINE id, so the tambon filter now starts at `'ทุกตำบล'`.

6. Replace `if (!isAuthenticated) return null` and the `displayName` / `avatarUrl` / `handleLogout` lines (191–199) with:

```ts
  if (!account) return null
```

7. In the header, replace the `<div style={{ position: 'relative' }}>` block after `<MenuButton />` (through its closing `</div>`, the line before the header's closing `</div>`) with:

```tsx
          <UserAccountMenu account={account} onLogout={logout} />
```

8. Run: `grep -nE "useAuth|useLiff|liff|emailUser|router|profileOpen|avatarUrl|displayName|isAuthenticated|<Image" app/waste-types/page.tsx`
Expected: no output.

- [ ] **Step 4: Use the shared 401/403 handling in the data hooks**

In `lib/use-admin-list.ts`:
- Delete the local `redirectToLogin` function and its comment (lines 8–11) and add `import { handleAuthFailure } from '@/lib/auth-client'`.
- Replace `if (res.status === 401) return redirectToLogin()` (both places) with `if (handleAuthFailure(res.status)) return`.
- In `fetchAllRows`, replace the `if (res.status === 401) { redirectToLogin(); throw ... }` block with:

```ts
    if (handleAuthFailure(res.status)) throw new Error('กรุณาเข้าสู่ระบบใหม่')
```

In `lib/use-dashboard.ts`, add `import { handleAuthFailure } from '@/lib/auth-client'` and replace the `if (res.status === 401) { window.location.href = ...; throw ... }` block with:

```ts
      if (handleAuthFailure(res.status)) throw new Error('กรุณาเข้าสู่ระบบใหม่')
```

- [ ] **Step 5: Remove the old providers and login code**

In `app/layout.tsx` delete the `AuthProvider` and `LiffProvider` imports and change the body to:

```tsx
      <body className="font-sans antialiased">
        <SidebarProvider>{children}</SidebarProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
```

Then run:

```bash
git rm lib/auth-context.tsx lib/liff-context.tsx lib/db/admin-session.ts app/api/admin/login/route.ts app/api/admin/logout/route.ts app/api/admin/session/route.ts
pnpm remove @line/liff
```

In `lib/site.ts` change `export const LOGIN_HREF = '/admin/login?next=/admin/dashboard'` to:

```ts
export const LOGIN_HREF = '/login'
```

- [ ] **Step 6: Check nothing still references the removed code**

Run: `grep -rnE "auth-context|liff-context|admin-session|useLiff|useAuth\b|@line/liff|/api/admin/(login|logout|session)|ADMIN_PASSWORD" app components lib package.json`
Expected: no output.

- [ ] **Step 7: Update `.env.example`**

Replace the `# ─── LINE LIFF` section (2 lines) with nothing, and replace the whole `# ─── ล็อกอินแอดมิน` section (from that header to the end of the file) with:

```bash
# ─── ระบบบัญชีแดชบอร์ด (Supabase Auth + schema `dashboard`) ────────────────
# บัญชีแดชบอร์ดแยกจากผู้ใช้ LINE ของแอปจัดการขยะ — ตั้งค่าครั้งเดียว:
#   1) รัน supabase/dashboard_schema.sql ใน Supabase → SQL Editor
#   2) Settings → API → Exposed schemas: เพิ่ม `dashboard`
#   3) Authentication → Providers → Email: ปิด "Allow new users to sign up"
#   4) pnpm run create-root-admin you@example.com  (root admin คนแรก — ได้รับอีเมลแจ้งผู้สมัครใหม่)
#   ย้าย root ภายหลัง: pnpm run transfer-root new-root@example.com
# คีย์เซ็น cookie เซสชันและลิงก์ในอีเมล (อย่างน้อย 32 ตัวอักษร) สร้างด้วย: openssl rand -base64 48
# เปลี่ยนค่านี้ = ทุกคนต้องล็อกอินใหม่ และลิงก์ในอีเมลที่ส่งไปแล้วใช้ไม่ได้
DASHBOARD_SESSION_SECRET=
# URL ของแดชบอร์ด ใช้สร้างลิงก์ในอีเมล (ไม่มี / ท้าย) — บน production ต้องตั้ง
APP_BASE_URL=

# ─── อีเมล (Gmail SMTP) ──────────────────────────────────────────────────────
# บัญชี Gmail ที่ใช้ส่ง + App password (Google Account → Security → 2-Step Verification → App passwords)
# ถ้าเว้นว่าง ระบบยังทำงานได้แต่จะไม่ส่งอีเมล (สมัคร/อนุมัติ/ลืมรหัสผ่าน)
GMAIL_USER=
GMAIL_APP_PASSWORD=
```

Also update the Supabase section comment line `# ตั้งทั้งสองค่านี้แล้วหน้าแอดมินจะอ่านจาก Supabase schema \`app\`; ถ้าเว้นว่างจะใช้ข้อมูลตัวอย่าง (lib/db/mock.ts)` to:

```bash
# หน้าแอดมินอ่านข้อมูลจาก Supabase schema `app`; ระบบบัญชีแดชบอร์ดใช้ schema `dashboard` ของโปรเจกต์เดียวกัน
```

- [ ] **Step 8: Run tests and the type check**

Run: `pnpm test`
Expected: PASS.

Run: `pnpm exec tsc --noEmit -p .`
Expected: only the pre-existing `components/dashboard/TopContributors.tsx(37,143)` error.

- [ ] **Step 9: Commit**

```bash
git add -A app components lib .env.example package.json pnpm-lock.yaml
git commit -m "feat: Use dashboard accounts on user pages and remove old login

Removes the mock email accounts, the browser-only LINE check and the
shared ADMIN_PASSWORD login.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 14: Verification

**Files:** none created; this task runs checks and reports.

- [ ] **Step 1: Full automated checks**

Run: `pnpm test`
Expected: every suite PASS.

Run: `pnpm exec tsc --noEmit -p .`
Expected: only the pre-existing `TopContributors.tsx(37,143)` error.

Run: `pnpm build`
Expected: build succeeds; the route list includes `/login`, `/signup`, `/verify-email`, `/forgot-password`, `/reset-password`, `/admin/accounts`, `/api/auth/*`, `/api/admin/accounts`, `/api/admin/accounts/[id]`.

- [ ] **Step 2: Confirm the login code never touches the `app` schema**

Run: `grep -rnE "Profile.*'app'|schema: 'app'|from\('app|app\." lib/auth app/api/auth app/api/admin/accounts scripts supabase/dashboard_schema.sql | grep -v "app\.users\b" || echo clean`
Expected: `clean` (no reference to the `app` schema in login code).

- [ ] **Step 3: Database checks against the Supabase project (needs the user)**

Ask the user to:
1. Run `supabase/dashboard_schema.sql` in the Supabase SQL editor.
2. Run `supabase/dashboard_schema_checks.sql` and confirm the notices `checks 1-5 passed` and `check 6 passed`.
3. Add `dashboard` to Settings → API → Exposed schemas.
4. Turn off Authentication → Providers → Email → "Allow new users to sign up".
5. Set `DASHBOARD_SESSION_SECRET`, `APP_BASE_URL`, `GMAIL_USER`, `GMAIL_APP_PASSWORD` in `.env.local`.
6. Run `pnpm run create-root-admin <their email>` and keep the printed password.

- [ ] **Step 4: Manual end-to-end walk-through** (`pnpm dev`, real Gmail)

1. Root admin logs in at `/login` → lands on `/admin/dashboard`; sidebar shows "บัญชีแดชบอร์ด".
2. In a private window: `/signup` with a second email → "ตรวจสอบอีเมลของคุณ"; the confirmation email arrives.
3. Log in with it before confirming → "กรุณายืนยันอีเมลก่อน" plus the resend button.
4. Open the email link → `/verify-email` → click "ยืนยันอีเมล" → `/login?notice=verified`; root receives "คำขอเปิดบัญชีแดชบอร์ดใหม่". Clicking the button again → "ลิงก์ไม่ถูกต้อง หมดอายุ หรือถูกใช้ไปแล้ว".
5. Log in as the new person → "กำลังรอผู้ดูแลระบบอนุมัติ".
6. As root: `/admin/accounts` → approve as user → the person gets the approval email.
7. The person logs in → `/map`; `/waste-types` loads data; visiting `/admin/dashboard` sends them back to `/map`.
8. As root: disable the person → their next click on `/map` data redirects to `/login`.
9. Enable them again, then use `/forgot-password` → email → `/reset-password` → `/login?notice=reset`; the old session in the other window is logged out; reusing the reset link fails.
10. As root: the root row and own row show no action buttons; deleting the person removes them from the list.
11. Visit `/admin/login?next=/admin/users` → redirected to `/login?next=%2Fadmin%2Fusers`; after login as root → `/admin/users`.
12. Confirm in the Supabase password-grant behaviour that the service-role key is accepted (login works at step 1). If login answers 500 and the server log shows a 401 from `/auth/v1/token`, add a server-only `SUPABASE_ANON_KEY` and use it as `apikey` only in `verifyPassword`.

- [ ] **Step 5: Report**

Report which automated checks passed (with output), which manual steps the user ran, and anything not verified.
