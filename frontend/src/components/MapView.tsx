import { useEffect, useRef, useState } from 'react'

declare const naver: any // eslint-disable-line @typescript-eslint/no-explicit-any

export type MapPin = {
  id: string
  lat: number
  lng: number
  name: string
  costPerHour: number
}

const NAVER_CLIENT_ID = 'ujztcsarfi'
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
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${NAVER_CLIENT_ID}`
    script.onload = () => resolve()
    script.onerror = reject
    document.head.appendChild(script)
  })
}

function markerIcon(name: string, isSel: boolean) {
  const label = name.replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`)
  return {
    content: `<div style="
      background:${isSel ? '#3f6b4e' : '#fffdf7'};
      color:${isSel ? '#fff' : '#2b2722'};
      border:1.5px solid ${isSel ? '#3f6b4e' : '#e0d7c2'};
      border-radius:999px;
      padding:4px 12px;
      font-size:12px;
      font-weight:700;
      white-space:nowrap;
      max-width:140px;
      overflow:hidden;
      text-overflow:ellipsis;
      box-shadow:0 2px 8px rgba(0,0,0,.18);
      cursor:pointer;
      transform:translateY(-100%);
    ">${label}</div>`,
    anchor: new naver.maps.Point(24, 0),
  }
}

type GeoState = 'idle' | 'loading' | 'error'

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
  const prevSelectedRef = useRef<string | null>(null)
  const myLocationMarkerRef = useRef<any>(null)
  const [ready, setReady] = useState(typeof naver !== 'undefined')
  const [mapError, setMapError] = useState('')
  const [geoState, setGeoState] = useState<GeoState>('idle')

  // 키/도메인 인증 실패는 예외가 아니라 이 전역 콜백으로만 알려준다
  useEffect(() => {
    ;(window as any).navermap_authFailure = () =>
      setMapError('네이버 지도 인증 실패: Client ID 또는 콘솔에 등록된 서비스 URL을 확인하세요')
  }, [])

  // 스크립트 로드
  useEffect(() => {
    if (ready) return
    loadNaverMapsScript()
      .then(() => setReady(true))
      .catch((e) => setMapError(`SDK 로드 실패: ${e}`))
  }, [ready])

  // 지도 초기화 (스크립트 로드 후 1회)
  useEffect(() => {
    if (!ready || !containerRef.current || mapRef.current) return
    try {
      mapRef.current = new naver.maps.Map(containerRef.current, {
        center: new naver.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
        zoom: DEFAULT_ZOOM,
        mapTypeControl: false,
        scaleControl: false,
      })
    } catch (e) {
      // eslint-disable-next-line react/set-state-in-effect
      setMapError(`지도 초기화 실패: ${e}`)
    }
  }, [ready])

  // Latest pins for the pan effect below, which must not re-run when only the pins change
  const pinsRef = useRef(pins)

  // 핀 생성 — pins/onSelect가 바뀔 때만 전체 재생성 (selected 변경 시에는 실행 안 함)
  useEffect(() => {
    pinsRef.current = pins
    if (!mapRef.current) return

    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current.clear()

    const curSel = prevSelectedRef.current

    pins.forEach((pin) => {
      const isSel = pin.id === curSel
      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(pin.lat, pin.lng),
        map: mapRef.current,
        zIndex: isSel ? 1000 : 0,
        icon: markerIcon(pin.name, isSel),
      })
      naver.maps.Event.addListener(marker, 'click', () => onSelect(pin.id))
      markersRef.current.set(pin.id, marker)
    })
  }, [pins, onSelect, ready])

  // 선택 상태 변경 — 이전/새 핀 아이콘 2개만 교체 (전체 재생성 없음)
  useEffect(() => {
    if (!mapRef.current) return

    const prev = prevSelectedRef.current
    prevSelectedRef.current = selected

    if (prev) {
      const m = markersRef.current.get(prev)
      const p = pinsRef.current.find((x) => x.id === prev)
      if (m && p) { m.setIcon(markerIcon(p.name, false)); m.setZIndex(0) }
    }
    if (selected) {
      const m = markersRef.current.get(selected)
      const p = pinsRef.current.find((x) => x.id === selected)
      if (m && p) { m.setIcon(markerIcon(p.name, true)); m.setZIndex(1000) }
    }
  }, [selected, ready])

  // Move the map only when the selection changes
  useEffect(() => {
    if (!mapRef.current || !selected) return
    const pin = pinsRef.current.find((p) => p.id === selected)
    if (pin) mapRef.current.panTo(new naver.maps.LatLng(pin.lat, pin.lng))
  }, [selected, ready])

  const moveToMyLocation = () => {
    if (!navigator.geolocation) { setGeoState('error'); return }
    setGeoState('loading')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoState('idle')
        if (!mapRef.current) return
        const latlng = new naver.maps.LatLng(pos.coords.latitude, pos.coords.longitude)
        mapRef.current.panTo(latlng)
        mapRef.current.setZoom(15)
        if (myLocationMarkerRef.current) myLocationMarkerRef.current.setMap(null)
        myLocationMarkerRef.current = new naver.maps.Marker({
          position: latlng,
          map: mapRef.current,
          icon: {
            content: `<div style="
              width:14px;height:14px;
              background:#3b82f6;
              border:2.5px solid #fff;
              border-radius:50%;
              box-shadow:0 0 0 4px rgba(59,130,246,.25);
            "></div>`,
            anchor: new naver.maps.Point(7, 7),
          },
          zIndex: 2000,
        })
      },
      () => setGeoState('error'),
      { timeout: 8000 },
    )
  }

  if (mapError) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-2xl border border-line-3 bg-ivory-deep p-6 text-center">
        <div>
          <p className="text-sm font-semibold text-error">지도를 불러오지 못했어요</p>
          <p className="mt-1 text-xs text-ink-2 break-all">{mapError}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">
      <div
        ref={containerRef}
        className="h-full w-full overflow-hidden rounded-2xl border border-line-3"
      >
        {!ready && (
          <div className="flex h-full items-center justify-center text-sm text-ink-2">
            지도 로딩 중...
          </div>
        )}
      </div>
      {ready && (
        <button
          type="button"
          onClick={moveToMyLocation}
          disabled={geoState === 'loading'}
          title={geoState === 'error' ? '위치 권한을 허용해 주세요' : '현재 위치로 이동'}
          className={`absolute bottom-3 left-3 z-10 flex h-9 w-9 items-center justify-center rounded-xl border shadow-md transition ${
            geoState === 'error'
              ? 'border-error bg-white text-error'
              : 'border-line bg-white text-ink-2 hover:text-ink'
          }`}
        >
          {geoState === 'loading' ? (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
              <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
            </svg>
          )}
        </button>
      )}
    </div>
  )
}
