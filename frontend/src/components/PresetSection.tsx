import { useMatchStore } from '../store/matchStore'
import { draftToPresetItems, type Preset } from '../data/presets'
import type { Child, RecurringSchedule } from '../data/types'

export function PresetSection({
  presets,
  draft,
  kids,
  onLoad,
  onUpdate,
  onDelete,
}: {
  presets: Preset[]
  draft: RecurringSchedule[]
  kids: Child[]
  onLoad: (preset: Preset) => void
  onUpdate: (preset: Preset) => void
  onDelete: (id: string) => void
}) {
  const match = useMatchStore()

  if (presets.length === 0) {
    return <p className="text-xs text-ink-2">저장된 프리셋이 없어요</p>
  }

  return (
    <div className="flex flex-col gap-1.5">
      {presets.map((p) => (
        <div key={p.id} className="flex items-center gap-2 rounded-lg bg-ivory-deep-2 px-3 py-2 text-sm">
          <button
            type="button"
            onClick={() => { if (window.confirm(`'${p.name}' 프리셋을 불러올까요?`)) onLoad(p) }}
            className="focus-ring flex-1 text-left font-semibold text-ink hover:text-green"
          >
            {p.name}
          </button>
          <button
            type="button"
            onClick={() => {
              if (!window.confirm(`'${p.name}' 프리셋을 현재 일정으로 업데이트할까요?`)) return
              onUpdate({ ...p, items: draftToPresetItems(draft, kids), region: match.region || undefined, district: match.district || undefined })
            }}
            className="focus-ring text-xs font-semibold text-ink-2"
          >
            업데이트
          </button>
          <button
            type="button"
            onClick={() => { if (window.confirm(`'${p.name}' 프리셋을 삭제할까요?`)) onDelete(p.id) }}
            className="focus-ring text-xs font-semibold text-error"
          >
            삭제
          </button>
        </div>
      ))}
    </div>
  )
}
