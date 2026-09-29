import { centers } from '../data/centers'
import type { Center } from '../data/types'

export function fetchCenters(): Promise<Center[]> {
  return Promise.resolve(centers)
}
