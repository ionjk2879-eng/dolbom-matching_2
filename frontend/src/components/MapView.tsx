import { useEffect, useRef, useState } from 'react'
import type { Center } from '../data/types'

declare const naver: any // eslint-disable-line @typescript-eslint/no-explicit-any

export type MapPin = Pick<Center, 'id' | 'lat' | 'lng' | 'name' | 'feeMonthly'>

const NAVER_CLIENT_ID = 'l889wyovvq'
const DEFAULT_CENTER = { lat: 36.351, lng: 127.385 }
const DEFAULT_ZOOM = 14

function loadNaverMapsScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof naver !== 'undefined') { resolve(); return }
    const existing = document.getElementById('naver-maps-sdk')
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', reject)
      return
    }
    const script = document.createElement('script')
    script.id = 'naver-maps-sdk'
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${NAVER_CLIENT_ID}`
    script.onload = () => resolve()
    script.onerror = reject
    document.head.appendChild(script)
  })
}

export function MapView({
  pins,
  selected,
  onSelect,
}: {
  pins: MapPin[]
  selected: string | null
  onSelect: (id: string) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<Map<string, any>>(new Map())
  const [ready, setReady] = useState(typeof naver !== 'undefined')

  // 스크립트 로드
  useEffect(() => {
    if (ready) return
    loadNaverMapsScript()
      .then(() => setReady(true))
      .catch((e) => console.error('Naver Maps 로드 실패', e))
  }, [ready])

  // 지도 초기화 (스크립트 로드 후 1회)
  useEffect(() => {
    if (!ready || !containerRef.current || mapRef.current) return
    mapRef.current = new naver.maps.Map(containerRef.current, {
      center: new naver.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
      zoom: DEFAULT_ZOOM,
      mapTypeControl: false,
      scaleControl: false,
    })
  }, [ready])

  // 핀 & 선택 상태 동기화
  useEffect(() => {
    if (!mapRef.current) return

    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current.clear()

    pins.forEach((pin) => {
      const isSel = pin.id === selected
      const label = pin.feeMonthly === 0 ? '무료' : `${Math.round(pin.feeMonthly / 10000)}만`
      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(pin.lat, pin.lng),
        map: mapRef.current,
        icon: {
          content: `<div style="
            background:${isSel ? '#3f6b4e' : '#fffdf7'};
            color:${isSel ? '#fff' : '#2b2722'};
            border:1.5px solid ${isSel ? '#3f6b4e' : '#e0d7c2'};
            border-radius:999px;
            padding:4px 12px;
            font-size:12px;
            font-weight:700;
            white-space:nowrap;
            box-shadow:0 2px 8px rgba(0,0,0,.18);
            cursor:pointer;
            transform:translateY(-100%);
          ">${label}</div>`,
          anchor: new naver.maps.Point(24, 0),
        },
      })
      naver.maps.Event.addListener(marker, 'click', () => onSelect(pin.id))
      markersRef.current.set(pin.id, marker)
    })

    if (selected) {
      const pin = pins.find((p) => p.id === selected)
      if (pin) mapRef.current.panTo(new naver.maps.LatLng(pin.lat, pin.lng))
    }
  }, [pins, selected, onSelect, ready])

  return (
    <div
      ref={containerRef}
      className="h-full min-h-[420px] w-full overflow-hidden rounded-2xl border border-line-3"
    >
      {!ready && (
        <div className="flex h-full min-h-[420px] items-center justify-center text-sm text-ink-3">
          지도 로딩 중...
        </div>
      )}
    </div>
  )
}
