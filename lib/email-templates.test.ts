import { describe, expect, it } from 'vitest'
import { approvedMail, newSignupMail, rejectedMail, resetPasswordMail, verifyEmailMail } from './email-templates'

describe('email templates', () => {
  it('puts the link in both the text and the HTML body', () => {
    const m = verifyEmailMail('a@b.co', 'https://dash.example/verify-email?token=abc')
    expect(m.to).toBe('a@b.co')
    expect(m.text).toContain('https://dash.example/verify-email?token=abc')
    expect(m.html).toContain('href="https://dash.example/verify-email?token=abc"')
    expect(m.text).toContain('รหัสผ่านที่ตั้งไว้ตอนสมัคร')
  })

  it('does not carry any applicant-supplied text in the confirmation email', () => {
    const m = verifyEmailMail('a@b.co', 'https://dash.example/verify-email?token=abc')
    expect(m.text).toContain('สวัสดี')
    expect(m.text).not.toContain('สมชาย')
    expect(verifyEmailMail.length).toBe(2)
  })

  it('escapes HTML in names', () => {
    const m = newSignupMail('root@b.co', { name: '<script>x</script>', email: 'a@b.co' }, 'https://dash.example/admin/accounts')
    expect(m.html).not.toContain('<script>')
    expect(m.html).toContain('&lt;script&gt;')
  })

  it('takes no sign-up text in any email sent to the account holder', () => {
    // ชื่อมาจากคนที่กรอกฟอร์มสมัคร — อีเมลถึงเจ้าของบัญชีจึงไม่ใส่ชื่อ (กันใช้แทรกข้อความสแปม)
    expect(resetPasswordMail.length).toBe(2)
    expect(approvedMail.length).toBe(3)
    expect(rejectedMail.length).toBe(1)
    const reset = resetPasswordMail('a@b.co', 'https://dash.example/reset-password?token=abc')
    expect(reset.text).toContain('สวัสดี')
    expect(reset.text).toContain('https://dash.example/reset-password?token=abc')
    expect(reset.html).toContain('href="https://dash.example/reset-password?token=abc"')
  })

  it('says which role was approved', () => {
    expect(approvedMail('a@b.co', 'admin', 'https://dash.example/login').text).toContain('แอดมิน')
    expect(approvedMail('a@b.co', 'user', 'https://dash.example/login').text).toContain('ผู้ใช้')
  })

  it('has a subject on every message', () => {
    const all = [
      verifyEmailMail('a@b.co', 'u'),
      newSignupMail('a@b.co', { name: 'x', email: 'y' }, 'u'),
      approvedMail('a@b.co', 'user', 'u'),
      rejectedMail('a@b.co'),
      resetPasswordMail('a@b.co', 'u'),
    ]
    for (const m of all) expect(m.subject.length).toBeGreaterThan(0)
  })
})
