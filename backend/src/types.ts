export type Env = {
  DATABASE_URL: string
  JWT_SECRET: string
  KAKAO_CLIENT_ID: string
  KAKAO_CLIENT_SECRET: string
  NAVER_CLIENT_ID: string
  NAVER_CLIENT_SECRET: string
  FRONTEND_URL: string
}

export type User = {
  id: string
  provider: 'kakao' | 'naver'
  provider_id: string
  email: string | null
  name: string | null
  profile_image: string | null
  created_at: string
  updated_at: string
}
