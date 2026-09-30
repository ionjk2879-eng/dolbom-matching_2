import { Hono } from 'hono'
import { sign, verify } from 'hono/jwt'
import { createDb } from '../db/index'
import { upsertUser, findUserById } from '../db/users'
import type { Env } from '../types'

const KAKAO_AUTH = 'https://kauth.kakao.com/oauth/authorize'
const KAKAO_TOKEN = 'https://kauth.kakao.com/oauth/token'
const KAKAO_USER = 'https://kapi.kakao.com/v2/user/me'

const NAVER_AUTH = 'https://nid.naver.com/oauth2.0/authorize'
const NAVER_TOKEN = 'https://nid.naver.com/oauth2.0/token'
const NAVER_USER = 'https://openapi.naver.com/v1/nid/me'

const auth = new Hono<{ Bindings: Env }>()

async function signState(secret: string): Promise<string> {
  const rand = crypto.getRandomValues(new Uint8Array(16))
  const nonce = Array.from(rand, (b) => b.toString(16).padStart(2, '0')).join('')
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(nonce))
  const sigHex = Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('')
  return `${nonce}.${sigHex}`
}

async function verifyState(state: string, secret: string): Promise<boolean> {
  const dot = state.lastIndexOf('.')
  if (dot === -1) return false
  const nonce = state.slice(0, dot)
  const sigHex = state.slice(dot + 1)
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(nonce))
  const expected = Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('')
  return sigHex === expected
}

function getCallbackUrl(req: Request, provider: string): string {
  const { protocol, host } = new URL(req.url)
  return `${protocol}//${host}/auth/${provider}/callback`
}

async function issueJwt(userId: string, secret: string): Promise<string> {
  return sign(
    { sub: userId, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 },
    secret
  )
}

// ── Kakao ──────────────────────────────────────────────────────────────────

auth.get('/kakao', async (c) => {
  const state = await signState(c.env.JWT_SECRET)
  const params = new URLSearchParams({
    client_id: c.env.KAKAO_CLIENT_ID,
    redirect_uri: getCallbackUrl(c.req.raw, 'kakao'),
    response_type: 'code',
    state,
  })
  return c.redirect(`${KAKAO_AUTH}?${params}`)
})

auth.get('/kakao/callback', async (c) => {
  const frontendUrl = c.env.FRONTEND_URL
  try {
    const { code, state, error } = c.req.query()
    if (error || !code || !state)
      return c.redirect(`${frontendUrl}/login?error=cancelled`)
    if (!(await verifyState(state, c.env.JWT_SECRET)))
      return c.redirect(`${frontendUrl}/login?error=invalid_state`)

    const tokenRes = await fetch(KAKAO_TOKEN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: c.env.KAKAO_CLIENT_ID,
        client_secret: c.env.KAKAO_CLIENT_SECRET,
        redirect_uri: getCallbackUrl(c.req.raw, 'kakao'),
        code,
      }),
    })
    if (!tokenRes.ok) return c.redirect(`${frontendUrl}/login?error=token_failed`)

    const { access_token } = (await tokenRes.json()) as { access_token: string }

    const userRes = await fetch(KAKAO_USER, {
      headers: { Authorization: `Bearer ${access_token}` },
    })
    const kakao = (await userRes.json()) as {
      id: number
      kakao_account?: {
        email?: string
        profile?: { nickname?: string; profile_image_url?: string }
      }
    }

    const sql = createDb(c.env.DATABASE_URL)
    const user = await upsertUser(sql, {
      provider: 'kakao',
      provider_id: String(kakao.id),
      email: kakao.kakao_account?.email,
      name: kakao.kakao_account?.profile?.nickname,
      profile_image: kakao.kakao_account?.profile?.profile_image_url,
    })
    await sql.end()

    const token = await issueJwt(user.id, c.env.JWT_SECRET)
    return c.redirect(`${frontendUrl}/auth/callback?token=${token}`)
  } catch (e) {
    console.error('kakao callback error:', e)
    return c.redirect(`${frontendUrl}/login?error=unknown`)
  }
})

// ── Naver ──────────────────────────────────────────────────────────────────

auth.get('/naver', async (c) => {
  const state = await signState(c.env.JWT_SECRET)
  const params = new URLSearchParams({
    client_id: c.env.NAVER_CLIENT_ID,
    redirect_uri: getCallbackUrl(c.req.raw, 'naver'),
    response_type: 'code',
    state,
  })
  return c.redirect(`${NAVER_AUTH}?${params}`)
})

auth.get('/naver/callback', async (c) => {
  const frontendUrl = c.env.FRONTEND_URL
  try {
    const { code, state, error } = c.req.query()
    if (error || !code || !state)
      return c.redirect(`${frontendUrl}/login?error=cancelled`)
    if (!(await verifyState(state, c.env.JWT_SECRET)))
      return c.redirect(`${frontendUrl}/login?error=invalid_state`)

    const tokenRes = await fetch(NAVER_TOKEN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: c.env.NAVER_CLIENT_ID,
        client_secret: c.env.NAVER_CLIENT_SECRET,
        redirect_uri: getCallbackUrl(c.req.raw, 'naver'),
        code,
        state,
      }),
    })
    if (!tokenRes.ok) return c.redirect(`${frontendUrl}/login?error=token_failed`)

    const { access_token } = (await tokenRes.json()) as { access_token: string }

    const userRes = await fetch(NAVER_USER, {
      headers: { Authorization: `Bearer ${access_token}` },
    })
    const { response: naver } = (await userRes.json()) as {
      response: { id: string; email?: string; name?: string; profile_image?: string }
    }

    const sql = createDb(c.env.DATABASE_URL)
    const user = await upsertUser(sql, {
      provider: 'naver',
      provider_id: naver.id,
      email: naver.email,
      name: naver.name,
      profile_image: naver.profile_image,
    })
    await sql.end()

    const token = await issueJwt(user.id, c.env.JWT_SECRET)
    return c.redirect(`${frontendUrl}/auth/callback?token=${token}`)
  } catch (e) {
    console.error('naver callback error:', e)
    return c.redirect(`${frontendUrl}/login?error=unknown`)
  }
})

// ── Password hashing (PBKDF2 via Web Crypto) ───────────────────────────────

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, key, 256)
  const saltHex = Array.from(salt, (b) => b.toString(16).padStart(2, '0')).join('')
  const hashHex = Array.from(new Uint8Array(bits), (b) => b.toString(16).padStart(2, '0')).join('')
  return `${saltHex}:${hashHex}`
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(':')
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map((b) => parseInt(b, 16)))
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, key, 256)
  const computed = Array.from(new Uint8Array(bits), (b) => b.toString(16).padStart(2, '0')).join('')
  return computed === hashHex
}

// ── ID/PW 회원가입 & 로그인 ─────────────────────────────────────────────────

auth.get('/check-id', async (c) => {
  const loginId = c.req.query('loginId')
  if (!loginId) return c.json({ available: false })
  const sql = createDb(c.env.DATABASE_URL)
  const rows = await sql`SELECT id FROM users WHERE login_id = ${loginId}`
  await sql.end()
  return c.json({ available: rows.length === 0 })
})

auth.post('/register', async (c) => {
  const { loginId, password, name } = await c.req.json<{ loginId: string; password: string; name: string }>()
  if (!loginId || !password || !name) return c.json({ error: '필수 항목이 없어요' }, 400)
  if (password.length < 6) return c.json({ error: '비밀번호는 6자 이상이어야 해요' }, 400)

  const sql = createDb(c.env.DATABASE_URL)
  const existing = await sql`SELECT id FROM users WHERE login_id = ${loginId}`
  if (existing.length > 0) {
    await sql.end()
    return c.json({ error: '이미 사용 중인 아이디예요' }, 409)
  }

  const passwordHash = await hashPassword(password)
  const [user] = await sql<import('../types').User[]>`
    INSERT INTO users (provider, provider_id, name, login_id, password_hash)
    VALUES ('local', ${loginId}, ${name}, ${loginId}, ${passwordHash})
    RETURNING id, provider, provider_id, email, name, profile_image, login_id, created_at, updated_at
  `
  await sql.end()

  const token = await issueJwt(user.id, c.env.JWT_SECRET)
  return c.json({ token, user })
})

auth.post('/login', async (c) => {
  const { loginId, password } = await c.req.json<{ loginId: string; password: string }>()
  if (!loginId || !password) return c.json({ error: '아이디와 비밀번호를 입력해주세요' }, 400)

  const sql = createDb(c.env.DATABASE_URL)
  const [row] = await sql<(import('../types').User & { password_hash: string | null })[]>`
    SELECT * FROM users WHERE login_id = ${loginId} AND provider = 'local'
  `
  await sql.end()

  if (!row?.password_hash) return c.json({ error: '아이디 또는 비밀번호가 틀렸어요' }, 401)
  if (!(await verifyPassword(password, row.password_hash))) return c.json({ error: '아이디 또는 비밀번호가 틀렸어요' }, 401)

  const { password_hash: _, ...user } = row
  const token = await issueJwt(user.id, c.env.JWT_SECRET)
  return c.json({ token, user })
})

// ── /me & logout ───────────────────────────────────────────────────────────

auth.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return c.json({ user: null }, 401)

  const token = authHeader.slice(7)
  try {
    const payload = await verify(token, c.env.JWT_SECRET, 'HS256')
    const sql = createDb(c.env.DATABASE_URL)
    const user = await findUserById(sql, payload.sub as string)
    await sql.end()
    if (!user) return c.json({ user: null }, 401)
    return c.json({ user })
  } catch {
    return c.json({ user: null }, 401)
  }
})

auth.post('/logout', (c) => c.json({ ok: true }))

export default auth
