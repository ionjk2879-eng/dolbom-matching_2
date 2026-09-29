import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Consult } from '../data/types'

type ConsultState = {
  consults: Consult[]
  addConsult: (c: Omit<Consult, 'id' | 'createdAt'>) => void
}

export const useConsultStore = create<ConsultState>()(
  persist(
    (set) => ({
      consults: [],
      addConsult: (c) =>
        set((state) => ({
          consults: [...state.consults, { ...c, id: crypto.randomUUID(), createdAt: new Date().toISOString() }],
        })),
    }),
    { name: 'consult' },
  ),
)
