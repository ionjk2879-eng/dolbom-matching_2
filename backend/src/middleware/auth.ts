import { verify } from 'hono/jwt'
import type { MiddlewareHandler } from 'hono'
import type { Env } from '../types'

export type AuthVariables = { userId: string }

export const requireAuth: MiddlewareHandler<{ Bindings: Env; Variables: AuthVariables }> = async (c, next) => {
  const header = c.req.header('Authorization')
  if (!header?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const payload = await verify(header.slice(7), c.env.JWT_SECRET, 'HS256')
    c.set('userId', payload.sub as string)
    await next()
  } catch {
    return c.json({ error: 'Unauthorized' }, 401)
  }
}
