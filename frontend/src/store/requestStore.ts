import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { offers as initialOffers } from '../data/offers'
import type { CenterRequest, Offer } from '../data/types'

const initialRequests: CenterRequest[] = [
  {
    id: 'r1',
    grade: '초1~2',
    areas: ['유성구'],
    days: ['월', '화', '수'],
    pickupTime: '~오후7시',
    needs: ['차량 운행'],
    memo: '',
    createdAt: '2026-09-20',
    offerCount: 2,
    status: 'open',
  },
]

type RequestState = {
  requests: CenterRequest[]
  offers: Offer[]
  addRequest: (r: Omit<CenterRequest, 'id'>) => void
  toggleRequestStatus: (id: string) => void
  respondOffer: (id: string, status: Offer['status']) => void
}

export const useRequestStore = create<RequestState>()(
  persist(
    (set) => ({
      requests: initialRequests,
      offers: initialOffers,
      addRequest: (r) => set((s) => ({ requests: [{ ...r, id: crypto.randomUUID() }, ...s.requests] })),
      toggleRequestStatus: (id) =>
        set((s) => ({
          requests: s.requests.map((r) => (r.id === id ? { ...r, status: r.status === 'open' ? 'closed' : 'open' } : r)),
        })),
      respondOffer: (id, status) => set((s) => ({ offers: s.offers.map((o) => (o.id === id ? { ...o, status } : o)) })),
    }),
    { name: 'request' },
  ),
)
