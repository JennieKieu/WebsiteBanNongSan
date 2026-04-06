/** Claim chuẩn JWT từ ASP.NET Core (ClaimTypes) */
const CLAIM_NAME_ID = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'
const CLAIM_EMAIL = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/email'
const CLAIM_NAME = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'
const CLAIM_ROLE_MS = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
const CLAIM_ROLE_XML = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role'

function pickString(payload: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const v = payload[key]
    if (v != null && String(v).trim() !== '') return String(v)
  }
  return undefined
}

/**
 * Base64url → JSON payload (phần giữa của JWT).
 * Phải decode UTF-8 đúng cách: `atob` cho chuỗi byte Latin-1; nếu `JSON.parse` trực tiếp
 * thì tên tiếng Việt trong JWT sẽ thành mojibake (vd. Kiều → Kiá» u).
 */
export function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split('.')
  if (parts.length < 2) throw new Error('Token không hợp lệ')
  let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
  const pad = base64.length % 4
  if (pad) base64 += '='.repeat(4 - pad)
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  const json = new TextDecoder('utf-8').decode(bytes)
  return JSON.parse(json) as Record<string, unknown>
}

export type JwtUserFields = {
  id: string
  email: string
  name: string
  role: string
}

export function userFromJwtPayload(payload: Record<string, unknown>): JwtUserFields {
  const id =
    pickString(payload, 'sub', 'nameid', CLAIM_NAME_ID) ?? ''
  const email =
    pickString(payload, 'email', 'unique_name', CLAIM_EMAIL) ?? ''
  const name =
    (pickString(payload, 'name', 'unique_name', CLAIM_NAME) ?? email) || 'Khách'
  const role =
    pickString(payload, 'role', CLAIM_ROLE_MS, CLAIM_ROLE_XML) ?? 'User'

  return { id, email, name, role }
}
