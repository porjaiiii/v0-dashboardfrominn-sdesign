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
