import { useEffect, useRef } from 'react'
import type { Center } from '../data/types'

/* global naver */
declare const naver: any // eslint-disable-line @typescript-eslint/no-explicit-any

export type MapPin = Pick<Center, 'id' | 'lat' | 'lng' | 'name' | 'feeMonthly'>

const DEFAULT_CENTER = { lat: 36.351, lng: 127.385 }
const DEFAULT_ZOOM = 14

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

  // 지도 초기화 (마운트 1회)
  useEffect(() => {
    if (!containerRef.current || typeof naver === 'undefined') return
    mapRef.current = new naver.maps.Map(containerRef.current, {
      center: new naver.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
      zoom: DEFAULT_ZOOM,
      mapTypeControl: false,
      scaleControl: false,
      logoControl: true,
    })
  }, [])

  // 핀 & 선택 상태 동기화
  useEffect(() => {
    if (!mapRef.current || typeof naver === 'undefined') return

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

    // 선택된 센터로 지도 이동
    if (selected) {
      const pin = pins.find((p) => p.id === selected)
      if (pin) mapRef.current.panTo(new naver.maps.LatLng(pin.lat, pin.lng))
    }
  }, [pins, selected, onSelect])

  return (
    <div
      ref={containerRef}
      className="h-full min-h-[420px] w-full overflow-hidden rounded-2xl border border-line-3"
    />
  )
}
