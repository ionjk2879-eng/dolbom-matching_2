export type MapPin = {
  id: string
  lat: number
  lng: number
  name: string
  costPerHour: number
}

// ponytail: mock pin layout via lat/lng min-max normalization; swap for Kakao/Naver Map SDK when a real key is available
export function MapView({
  pins,
  selected,
  onSelect,
}: {
  pins: MapPin[]
  selected: string | null
  onSelect: (id: string) => void
}) {
  const lats = pins.map((p) => p.lat)
  const lngs = pins.map((p) => p.lng)
  const minLat = Math.min(...lats, 36.3)
  const maxLat = Math.max(...lats, 36.4)
  const minLng = Math.min(...lngs, 127.3)
  const maxLng = Math.max(...lngs, 127.4)

  return (
    <div className="placeholder-stripe relative h-full min-h-[420px] w-full overflow-hidden rounded-2xl border border-line-3">
      {pins.map((p) => {
        const left = ((p.lng - minLng) / (maxLng - minLng || 1)) * 80 + 10
        const top = 100 - (((p.lat - minLat) / (maxLat - minLat || 1)) * 80 + 10)
        const isSelected = selected === p.id
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p.id)}
            style={{ left: `${left}%`, top: `${top}%` }}
            className={`focus-ring absolute -translate-x-1/2 -translate-y-full rounded-full border px-3 py-1.5 text-xs font-bold shadow-sm transition ${
              isSelected
                ? 'z-10 border-green bg-green text-white'
                : 'border-line-2 bg-ivory-card text-ink hover:border-green/50'
            }`}
          >
            {p.costPerHour === 0 ? '무료' : `${p.costPerHour.toLocaleString()}원`}
          </button>
        )
      })}
    </div>
  )
}
