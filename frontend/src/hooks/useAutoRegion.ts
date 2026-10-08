import { useEffect } from 'react'
import type { CareOption } from '../data/types'
import { distanceKm } from '../data/geo'
import { locationOf } from '../data/careMatch'
import { useMatchStore } from '../store/matchStore'

// Farther than this from every care option (e.g. abroad), keep the full list instead of guessing a region
const MAX_KM = 30

// Ask once per page load, not on every page that mounts the hook
let asked = false

// Fill the region filter from where the user is: the nearest care option's address gives
// 시/도 and 구/군, so no reverse-geocoding API is needed. Never overrides a region the user picked.
export function useAutoRegion(options: CareOption[]) {
  useEffect(() => {
    if (asked || options.length === 0 || !navigator.geolocation) return
    if (useMatchStore.getState().region) return
    asked = true
    navigator.geolocation.getCurrentPosition((pos) => {
      const here = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      let nearest: CareOption | null = null
      let nearestKm = Infinity
      for (const o of options) {
        if (o.latitude == null || o.longitude == null) continue
        const km = distanceKm(here, { lat: Number(o.latitude), lng: Number(o.longitude) })
        if (km < nearestKm) {
          nearest = o
          nearestKm = km
        }
      }
      if (!nearest || nearestKm > MAX_KM) return
      const loc = locationOf(nearest.address)
      const match = useMatchStore.getState()
      if (!loc || match.region) return
      match.setRegion(loc.region)
      if (loc.district) match.setDistrict(loc.district)
    })
  }, [options])
}
