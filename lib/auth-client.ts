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
