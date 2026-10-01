import { serve } from '@hono/node-server'
import app from './index'
import type { Env } from './types'

const env: Env = {
  DATABASE_URL: process.env.DATABASE_URL ?? '',
  JWT_SECRET: process.env.JWT_SECRET ?? '',
  KAKAO_CLIENT_ID: process.env.KAKAO_CLIENT_ID ?? '',
  KAKAO_CLIENT_SECRET: process.env.KAKAO_CLIENT_SECRET ?? '',
  NAVER_CLIENT_ID: process.env.NAVER_CLIENT_ID ?? '',
  NAVER_CLIENT_SECRET: process.env.NAVER_CLIENT_SECRET ?? '',
  FRONTEND_URL: process.env.FRONTEND_URL ?? 'http://localhost:5173',
}

serve(
  {
    fetch: (req) =>
      app.fetch(req, env, { waitUntil: () => {}, passThroughOnException: () => {} }),
    port: Number(process.env.PORT ?? 3000),
  },
  (info) => console.log(`Server running on port ${info.port}`)
)
