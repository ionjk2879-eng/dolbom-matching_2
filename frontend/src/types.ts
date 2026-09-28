export type User = {
  id: string
  provider: 'kakao' | 'naver'
  email: string | null
  name: string | null
  profile_image: string | null
}
