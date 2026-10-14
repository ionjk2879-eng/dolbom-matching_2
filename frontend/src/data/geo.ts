export type LatLng = { lat: number; lng: number }

// 두 좌표 사이 직선거리(km), haversine
export function distanceKm(a: LatLng, b: LatLng): number {
  const rad = (d: number) => (d * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}

export function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`
}

export function naverMapUrl(lat: number | null, lng: number | null, name: string, address: string): string {
  if (lat != null && lng != null)
    return `https://map.naver.com/p/directions/-/${lng},${lat},${encodeURIComponent(name)}/car`
  return `https://map.naver.com/p/search/${encodeURIComponent(name + ' ' + address)}`
}

export function homepageUrl(url: string | null, name: string): string {
  if (url) return url.startsWith('http') ? url : `https://${url}`
  return `https://search.naver.com/search.naver?query=${encodeURIComponent(name)}`
}
