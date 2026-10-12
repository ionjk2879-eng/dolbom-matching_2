import { useState } from 'react'
import { Button } from './Button'
import { useMatchStore } from '../store/matchStore'
import { loadPresets, upsertPreset, deletePreset, draftToPresetItems, type Preset } from '../data/presets'
import type { Child, RecurringSchedule } from '../data/types'

export function PresetSection({
  draft,
  kids,
  onLoad,
}: {
  draft: RecurringSchedule[]
  kids: Child[]
  onLoad: (preset: Preset) => void
}) {
  const [presets, setPresets] = useState<Preset[]>(() => loadPresets())
  const [saveName, setSaveName] = useState('')
  const [showInput, setShowInput] = useState(false)
  const match = useMatchStore()

  const handleSavePreset = () => {
    if (!saveName.trim()) return
    const p: Preset = {
      id: Math.random().toString(36).slice(2),
      name: saveName.trim(),
      createdAt: new Date().toISOString(),
      items: draftToPresetItems(draft, kids),
      region: match.region || undefined,
      district: match.district || undefined,
    }
    upsertPreset(p)
    setPresets(loadPresets())
    setSaveName('')
    setShowInput(false)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <p className="text-xs font-semibold text-ink-2">프리셋</p>
        <button
          type="button"
          onClick={() => setShowInput((v) => !v)}
          className="focus-ring text-xs font-semibold text-green"
        >
          현재 일정을 프리셋으로 저장
        </button>
      </div>
      {showInput && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="프리셋 이름을 입력해주세요"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
            autoFocus
            className="focus-ring flex-1 rounded-lg border border-line-2 bg-ivory-card px-3 py-2 text-sm"
          />
          <Button onClick={handleSavePreset} disabled={!saveName.trim()}>저장</Button>
          <button
            type="button"
            onClick={() => { setShowInput(false); setSaveName('') }}
            className="focus-ring text-xs font-semibold text-ink-2"
          >
            취소
          </button>
        </div>
      )}
      {presets.length > 0 && (
        <div className="flex flex-col gap-1">
          {presets.map((p) => (
            <div key={p.id} className="flex items-center gap-2 rounded-lg bg-ivory-deep-2 px-3 py-2 text-sm">
              <span className="flex-1 text-ink">{p.name}</span>
              <button
                type="button"
                onClick={() => { if (window.confirm(`'${p.name}' 프리셋을 불러올까요?`)) onLoad(p) }}
                className="focus-ring text-xs font-semibold text-green"
              >
                불러오기
              </button>
              <button
                type="button"
                onClick={() => { if (window.confirm(`'${p.name}' 프리셋을 삭제할까요?`)) { deletePreset(p.id); setPresets(loadPresets()) } }}
                className="focus-ring text-xs font-semibold text-error"
              >
                삭제
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
