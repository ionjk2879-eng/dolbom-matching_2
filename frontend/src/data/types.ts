export type Center = {
  id: string
  name: string
  area: string
  district: string
  distanceM: number
  grade: string
  hours: string
  days: string[]
  feeMonthly: number
  seats: number
  rating: number
  reviews: number
  bus: boolean
  tags: string[]
  match: number
  lat: number
  lng: number
  type: string
}

export type Offer = {
  id: string
  centerId: string
  message: string
  start: string
  time: string
  fee: number
  bus: boolean
  status: 'pending' | 'accepted' | 'declined'
}

export type CenterRequest = {
  id: string
  grade: string
  areas: string[]
  days: string[]
  pickupTime: string
  needs: string[]
  memo: string
  createdAt: string
  offerCount: number
  status: 'open' | 'closed'
}

export type EventItem = {
  id: string
  gu: string
  kind: string
  title: string
  date: string
  age: string
  ageGroup: '유아' | '초등' | '양육자'
  place: string
  fee: string
  edu: boolean
  full?: boolean
  applied?: boolean
}

export type InfoArticle = {
  id: string
  category: 'play' | 'care' | 'card'
  title: string
  desc: string
  featured?: boolean
}

export type NewsItem = {
  id: number
  tag: string
  title: string
  date: string
}

export type Consult = {
  id: string
  centerId: string
  grade: string
  phone: string
  date: string
  message: string
  createdAt: string
}

export type Schedule = {
  id: string
  title: string
  date: string
  start: string
  end: string
  centerId: string
  memo: string
  // Shared by every schedule created from the same weekly repeat
  repeatId?: string
}
