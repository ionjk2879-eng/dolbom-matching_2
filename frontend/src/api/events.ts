import { events } from '../data/events'
import type { EventItem } from '../data/types'

export function fetchEvents(): Promise<EventItem[]> {
  return Promise.resolve(events)
}
