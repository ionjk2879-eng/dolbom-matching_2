import { useState, useEffect, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from './Button'
import { WeekScheduleGrid, type Target } from './WeekScheduleGrid'
import { isTouchDevice } from '../data/device'
import { GapWeekGrid } from './GapWeekGrid'
import { GapCalendarTab } from './GapCalendarTab'
import { useCareScheduleStore } from '../store/careScheduleStore'
import { blockLabel } from '../data/scheduleLabel'
import { useMatchStore } from '../store/matchStore'
import { REGIONS, careTypeLabels } from '../data/careMatch'
import { DISTRICTS } from '../data/districts'
import { ChildManager } from './ChildManager'
import { WEEKDAY_LABELS, toISO } from '../data/date'
import type { CareOption, Child, RecurringSchedule } from '../data/types'
import {
  loadPresets, upsertPreset, deletePreset, draftToPresetItems, presetItemsToDraft,
  type Preset, type PresetItem,
} from '../data/presets'

// Temporary IDs for draft-only schedules (never sent to server until save)
const tmpId = () => `__${Math.random().toString(36).slice(2, 9)}`
const isTemp = (id: string) => id.startsWith('__')

const SCHEDULE_PALETTE = [
  { hex: '#4285f4', name: '파랑' }, { hex: '#db4437', name: '빨강' }, { hex: '#0f9d58', name: '초록' },
  { hex: '#9c27b0', name: '보라' }, { hex: '#00897b', name: '청록' }, { hex: '#e64a19', name: '주황' },
  { hex: '#5c6bc0', name: '남색' }, { hex: '#039be5', name: '하늘' }, { hex: '#8d6e63', name: '갈색' },
  { hex: '#546e7a', name: '회청' },
]

function ScheduleEditForm({
  schedule,
  onClose,
  onSave,
  onRemove,
}: {
  schedule: RecurringSchedule
  onClose: () => void
  onSave: (id: string, data: Omit<RecurringSchedule, 'id'>) => void
  onRemove: (id: string) => void
}) {
  const { children } = useCareScheduleStore()
  const [startTime, setStartTime] = useState(schedule.startTime)
  const [endTime, setEndTime] = useState(schedule.endTime)
  const [color, setColor] = useState(schedule.color ?? '')
  const [error, setError] = useState('')

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (startTime >= endTime) return setError('끝나는 시간이 시작 시간보다 늦어야 해요')
    const { id, ...rest } = schedule
    onSave(id, { ...rest, startTime, endTime, color: color || undefined })
    onClose()
  }

  const handleRemove = () => {
    if (!window.confirm(`'${blockLabel(schedule, children)}' 일정을 삭제할까요?`)) return
    onRemove(schedule.id)
    onClose()
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3 rounded-xl border border-line p-3">
      <div>
        <label htmlFor="edit-start" className="text-xs font-semibold text-ink-2">
          시작
        </label>
        <input
          id="edit-start"
          type="time"
          step={1800}
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="focus-ring mt-1 block rounded-lg border border-line-2 bg-ivory-card px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="edit-end" className="text-xs font-semibold text-ink-2">
          끝
        </label>
        <input
          id="edit-end"
          type="time"
          step={1800}
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className="focus-ring mt-1 block rounded-lg border border-line-2 bg-ivory-card px-3 py-2 text-sm"
        />
      </div>
      <div>
        <p id="edit-color" className="text-xs font-semibold text-ink-2">색상</p>
        <div role="group" aria-labelledby="edit-color" className="mt-1 flex flex-wrap gap-1.5">
          {[{ hex: '', name: '기본' }, ...SCHEDULE_PALETTE].map(({ hex, name }) => (
            <button
              key={name}
              type="button"
              onClick={() => setColor(hex)}
              aria-label={name}
              aria-pressed={color === hex}
              title={name}
              className="focus-ring tap-target flex items-center justify-center rounded-full"
            >
              <span
                className={`block h-6 w-6 rounded-full border-2 ${color === hex ? 'border-ink' : hex ? 'border-transparent' : 'border-line'} ${hex ? '' : 'bg-ivory-card'}`}
                style={hex ? { backgroundColor: hex } : undefined}
              />
            </button>
          ))}
        </div>
      </div>
      <Button type="submit">저장</Button>
      <button type="button" onClick={handleRemove} className="focus-ring text-xs font-semibold text-error">
        삭제
      </button>
      <button type="button" onClick={onClose} className="focus-ring tap-target text-xs font-semibold text-ink-2">
        취소
      </button>
      {error && <p className="w-full text-xs text-error">{error}</p>}
    </form>
  )
}

// Touch replacement for drag-to-create: pick days and times, then the editor's onCreate
// merges it like a drag would (and tags it with the selected 엄마/아빠/아이 tab)
function ScheduleAddForm({ targetLabel, onCreate }: {
  targetLabel: string
  onCreate: (daysOfWeek: number[], startTime: string, endTime: string) => void | Promise<void>
}) {
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5])
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('18:00')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const toggleDay = (d: number) => setDays((ds) => (ds.includes(d) ? ds.filter((x) => x !== d) : [...ds, d].sort()))

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (days.length === 0) return setError('요일을 하나 이상 골라주세요')
    if (startTime >= endTime) return setError('끝나는 시간이 시작 시간보다 늦어야 해요')
    setError('')
    setSaving(true)
    await onCreate(days, startTime, endTime)
    setSaving(false)
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 rounded-xl border border-line p-3">
      <p className="text-sm font-bold text-ink">일정 추가 <span className="font-normal text-ink-2">· {targetLabel}</span></p>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="요일">
        {WEEKDAY_LABELS.map((label, d) => (
          <button
            key={d}
            type="button"
            aria-pressed={days.includes(d)}
            onClick={() => toggleDay(d)}
            className={`focus-ring h-11 w-11 rounded-full border text-sm font-semibold ${
              days.includes(d) ? 'border-green bg-green-soft text-green' : 'border-line-2 text-ink-2'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs font-semibold text-ink-2">
          시작
          <input type="time" step={1800} value={startTime} onChange={(e) => setStartTime(e.target.value)}
            className="focus-ring mt-1 block rounded-lg border border-line-2 bg-ivory-card px-3 py-2 text-sm" />
        </label>
        <label className="text-xs font-semibold text-ink-2">
          끝
          <input type="time" step={1800} value={endTime} onChange={(e) => setEndTime(e.target.value)}
            className="focus-ring mt-1 block rounded-lg border border-line-2 bg-ivory-card px-3 py-2 text-sm" />
        </label>
        <Button type="submit" disabled={saving}>{saving ? '추가 중...' : '추가'}</Button>
      </div>
      {error && <p className="text-xs text-error">{error}</p>}
    </form>
  )
}

function PresetSection({
  draft,
  kids,
  onLoad,
}: {
  draft: RecurringSchedule[]
  kids: Child[]
  onLoad: (items: PresetItem[]) => void
}) {
  const [presets, setPresets] = useState<Preset[]>(() => loadPresets())
  const [saveName, setSaveName] = useState('')
  const [showInput, setShowInput] = useState(false)

  const handleSavePreset = () => {
    if (!saveName.trim()) return
    const p: Preset = {
      id: Math.random().toString(36).slice(2),
      name: saveName.trim(),
      createdAt: new Date().toISOString(),
      items: draftToPresetItems(draft, kids),
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
                onClick={() => { if (window.confirm(`'${p.name}' 프리셋을 불러올까요?`)) onLoad(p.items) }}
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

// 아이 등록 + 부모/아이 반복 일정 캘린더. GapSetup 페이지와 Home 메인페이지에서 공용으로 쓴다.
export function CareScheduleEditor({ careOptions }: { careOptions?: CareOption[] } = {}) {
  const { children, schedules: allSchedules, addSchedule, removeSchedule, updateSchedule, loaded } = useCareScheduleStore()

  // Server non-care repeating schedules (source of truth for diff on save)
  const serverSchedules = allSchedules.filter((s) => !s.date && s.type !== 'care')
  // Care schedules always come from server (GapMatchPanel manages them, not draft)
  const careSchedules = allSchedules.filter((s) => s.type === 'care' && !s.date)

  // Draft state: user's pending changes (not yet sent to server)
  const [draft, setDraft] = useState<RecurringSchedule[]>([])
  const [isDirty, setIsDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // Sync server → draft once on initial load; never overwrite user's in-progress edits
  useEffect(() => {
    if (loaded && !initialized) {
      setDraft(serverSchedules)
      setInitialized(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded])

  // What the grid sees: user's draft + server-managed care schedules
  const schedules = [...draft, ...careSchedules]

  const match = useMatchStore()
  const [view, setView] = useState<'schedule' | 'gap' | 'calendar'>('schedule')
  const [target, setTarget] = useState<Target>({ type: 'parent', parentLabel: 'mom' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [multiSelIds, setMultiSelIds] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState(() => toISO(new Date()))

  const type = target.type === 'parent' ? 'parent_work' as const : 'child_school' as const
  const childId = target.type === 'child' ? target.childId : null
  const parentLabel = target.type === 'parent' ? target.parentLabel : undefined

  const activeSchedules = schedules.filter((s) =>
    target.type === 'parent'
      ? s.type === 'parent_work' && (s.parentLabel === parentLabel || (!s.parentLabel && parentLabel === 'mom'))
      : (s.type === 'child_school' || s.type === 'care') && s.childId === target.childId
  )

  // Draft mutation helpers
  const draftUpdate = (id: string, sch: Omit<RecurringSchedule, 'id'>) => {
    setDraft((prev) => prev.map((s) => (s.id === id ? { ...sch, id } : s)))
    setIsDirty(true)
  }
  const draftRemove = (id: string) => {
    setDraft((prev) => prev.filter((s) => s.id !== id))
    setIsDirty(true)
  }

  // Save draft to server: diff draft vs server, apply changes
  const handleSave = async () => {
    setSaving(true)
    try {
      const serverIds = new Set(serverSchedules.map((s) => s.id))
      const draftServerIds = new Set(draft.filter((s) => !isTemp(s.id)).map((s) => s.id))
      const toDelete = serverSchedules.filter((s) => !draftServerIds.has(s.id))
      const toAdd = draft.filter((s) => isTemp(s.id))
      const toUpdate = draft
        .filter((s) => !isTemp(s.id) && serverIds.has(s.id))
        .filter((s) => {
          const orig = serverSchedules.find((x) => x.id === s.id)!
          return (
            s.daysOfWeek.join() !== orig.daysOfWeek.join() ||
            s.startTime !== orig.startTime ||
            s.endTime !== orig.endTime ||
            s.parentLabel !== orig.parentLabel ||
            s.color !== orig.color ||
            s.title !== orig.title ||
            s.memo !== orig.memo
          )
        })
      await Promise.all([
        ...toDelete.map((s) => removeSchedule(s.id)),
        ...toUpdate.map((s) => { const { id, ...rest } = s; return updateSchedule(id, rest) }),
        ...toAdd.map((s) => { const { id: _id, ...rest } = s; return addSchedule(rest) }),
      ])
    } finally {
      const final = useCareScheduleStore.getState().schedules.filter((s) => !s.date && s.type !== 'care')
      setDraft(final)
      setIsDirty(false)
      setSaving(false)
    }
  }

  const handleDiscard = () => {
    setDraft(serverSchedules)
    setIsDirty(false)
  }

  // Grid callbacks operate on draft state
  const onCreate = (daysOfWeek: number[], startTime: string, endTime: string) => {
    setDraft((prev) => {
      const overlapIds = new Set(
        prev
          .filter(
            (s) =>
              s.type === type &&
              s.childId === childId &&
              (type === 'parent_work' ? s.parentLabel === parentLabel : true) &&
              s.daysOfWeek.some((d) => daysOfWeek.includes(d)) &&
              s.startTime < endTime &&
              s.endTime > startTime,
          )
          .map((s) => s.id),
      )
      const overlapping = prev.filter((s) => overlapIds.has(s.id))
      const remnants = overlapping.flatMap((s) =>
        s.daysOfWeek
          .filter((d) => !daysOfWeek.includes(d))
          .map((d) => ({ ...s, id: tmpId(), daysOfWeek: [d] })),
      )
      const newBlocks = daysOfWeek.map(
        (day) =>
          ({
            id: tmpId(),
            type,
            childId,
            daysOfWeek: [day],
            startTime,
            endTime,
            parentLabel,
          }) as RecurringSchedule,
      )
      return [...prev.filter((s) => !overlapIds.has(s.id)), ...remnants, ...newBlocks]
    })
    setIsDirty(true)
  }

  const onPunch = (id: string, punchStart: string, punchEnd: string) => {
    const s = schedules.find((x) => x.id === id)
    if (!s) return
    if (s.type === 'care') { removeSchedule(id); return }
    setDraft((prev) => {
      const found = prev.find((x) => x.id === id)
      if (!found) return prev
      const rem: RecurringSchedule[] = []
      if (found.startTime < punchStart) rem.push({ ...found, id: tmpId(), endTime: punchStart })
      if (found.endTime > punchEnd) rem.push({ ...found, id: tmpId(), startTime: punchEnd })
      return [...prev.filter((x) => x.id !== id), ...rem]
    })
    setIsDirty(true)
  }

  const onMove = (id: string, daysOfWeek: number[], startTime: string, endTime: string) => {
    const s = schedules.find((x) => x.id === id)
    if (!s) return
    if (s.type === 'care') {
      const { id: _id, ...rest } = s
      updateSchedule(id, { ...rest, daysOfWeek, startTime, endTime })
      return
    }
    const { id: _id, ...rest } = s
    draftUpdate(id, { ...rest, daysOfWeek, startTime, endTime })
  }

  return (
    <div className="flex flex-col gap-5">
      {/* 최상위 탭: 일정 등록 / 공백 패턴 / 공백 캘린더 */}
      <div className="inline-flex self-start rounded-xl border border-line bg-ivory-deep-2 p-1">
        {(['schedule', 'gap', 'calendar'] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={`focus-ring rounded-lg px-4 py-1.5 text-xs font-semibold ${view === v ? 'bg-ivory text-ink shadow-sm' : 'text-ink-2'}`}
          >
            {v === 'schedule' ? '일정 등록' : v === 'gap' ? '공백 패턴' : '공백 캘린더'}
          </button>
        ))}
      </div>

      {view === 'gap' ? (
        <GapWeekGrid kids={children} schedules={schedules} />
      ) : view === 'calendar' ? (
        <GapCalendarTab selectedDate={selectedDate} onSelectDate={setSelectedDate} />
      ) : (
        <>
          <div className="flex flex-col gap-3">
            <p className="text-sm font-bold text-ink">아이 등록</p>
            <ChildManager />
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-sm font-bold text-ink">거주지</p>
            <div className="flex flex-wrap gap-2">
              <select
                aria-label="시/도"
                value={match.region}
                onChange={(e) => match.setRegion(e.target.value)}
                className="focus-ring rounded-lg border border-line-2 bg-ivory-card px-3 py-2 text-sm"
              >
                <option value="">시/도 선택</option>
                {REGIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <select
                aria-label="구/군"
                value={match.district}
                onChange={(e) => match.setDistrict(e.target.value)}
                disabled={!match.region || (DISTRICTS[match.region]?.length ?? 0) === 0}
                className="focus-ring rounded-lg border border-line-2 bg-ivory-card px-3 py-2 text-sm disabled:opacity-40"
              >
                <option value="">구/군 전체</option>
                {(DISTRICTS[match.region] ?? []).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-sm font-bold text-ink">반복 일정 캘린더</p>
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={handleSave} disabled={!isDirty || saving}>
                {saving ? '저장 중...' : '저장'}
              </Button>
              {isDirty && (
                <button
                  type="button"
                  onClick={handleDiscard}
                  className="focus-ring text-xs font-semibold text-ink-2"
                >
                  되돌리기
                </button>
              )}
              <div className="inline-flex rounded-xl border border-line bg-ivory-deep-2 p-1">
                {(['mom', 'dad'] as const).map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setTarget({ type: 'parent', parentLabel: label })}
                    className={`focus-ring tap-target rounded-lg px-3 py-1.5 text-xs font-semibold ${
                      target.type === 'parent' && target.parentLabel === label ? 'bg-ivory text-ink' : 'text-ink-2'
                    }`}
                  >
                    {label === 'mom' ? '엄마 근무' : '아빠 근무'}
                  </button>
                ))}
                {children.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setTarget({ type: 'child', childId: c.id })}
                    className={`focus-ring tap-target rounded-lg px-3 py-1.5 text-xs font-semibold ${
                      target.type === 'child' && target.childId === c.id ? 'bg-ivory text-ink' : 'text-ink-2'
                    }`}
                  >
                    {c.name} 학교
                  </button>
                ))}
              </div>
            </div>

            {children.length === 0 && (
              <p className="text-xs text-ink-2">
                지금은 "부모 근무"만 등록할 수 있어요. 아이 학교 일정을 넣으려면 위에서 아이를 먼저 등록해주세요.
              </p>
            )}
            {isTouchDevice && (
              <ScheduleAddForm
                targetLabel={
                  target.type === 'parent'
                    ? (target.parentLabel === 'mom' ? '엄마 근무' : '아빠 근무')
                    : `${children.find((c) => c.id === target.childId)?.name ?? '아이'} 학교`
                }
                onCreate={onCreate}
              />
            )}
            <WeekScheduleGrid
              schedules={activeSchedules}
              kids={children}
              target={target}
              onCreate={onCreate}
              onEdit={setEditingId}
              onDelete={(id) => {
                const s = schedules.find((x) => x.id === id)
                if (s?.type === 'care') removeSchedule(id)
                else draftRemove(id)
              }}
              onPunch={onPunch}
              onMove={onMove}
              onSelectionChange={setMultiSelIds}
            />
            {editingId && (() => {
              const schedule = schedules.find((s) => s.id === editingId)
              if (!schedule) return null
              return (
                <ScheduleEditForm
                  key={editingId}
                  schedule={schedule}
                  onClose={() => setEditingId(null)}
                  onSave={(id, data) => {
                    const s = schedules.find((x) => x.id === id)
                    if (s?.type === 'care') {
                      updateSchedule(id, data)
                    } else {
                      draftUpdate(id, data)
                    }
                    // Multi-selected blocks follow only a color change
                    if (multiSelIds.length > 1 && data.color !== schedule.color) {
                      multiSelIds.filter((sid) => sid !== id).forEach((sid) => {
                        const ms = schedules.find((x) => x.id === sid)
                        if (ms && ms.color !== data.color) {
                          const { id: _msId, ...msRest } = ms
                          if (ms.type === 'care') updateSchedule(sid, { ...msRest, color: data.color })
                          else draftUpdate(sid, { ...msRest, color: data.color })
                        }
                      })
                    }
                  }}
                  onRemove={(id) => {
                    const s = schedules.find((x) => x.id === id)
                    if (s?.type === 'care') removeSchedule(id)
                    else draftRemove(id)
                  }}
                />
              )
            })()}

            {/* 선택된 돌봄 센터 목록 — 모든 탭에서 표시 */}
            {(() => {
              const careList = schedules.filter((s) => s.type === 'care')
              if (careList.length === 0) return null
              return (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold text-ink-2">선택된 돌봄</p>
                  <div className="flex flex-col gap-2">
                    {careList.map((s) => {
                      const option = careOptions?.find((o) => o.id === s.careOptionId)
                      const careChild = children.find((c) => c.id === s.childId)
                      const days = [...s.daysOfWeek].sort((a, b) => a - b).map((d) => WEEKDAY_LABELS[d]).join('')
                      return (
                        <div
                          key={s.id}
                          className="cursor-pointer rounded-xl border border-green bg-green-soft/20 px-3 py-3 hover:bg-green-soft/40 transition-colors"
                          onClick={() => { if (s.childId) setTarget({ type: 'child', childId: s.childId }) }}
                        >
                          <p className="text-sm font-bold text-ink">
                            {s.careOptionId ? (
                              <Link
                                to={`/find/${s.careOptionId}`}
                                className="hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {s.title ?? option?.name ?? '돌봄(선택)'}
                              </Link>
                            ) : (s.title ?? '돌봄(선택)')}
                            {option && <span className="ml-1 text-xs font-normal text-ink-2">· {careTypeLabels[option.type]}</span>}
                            {careChild && <span className="ml-1 text-xs font-normal text-ink-2">· {careChild.name}</span>}
                          </p>
                          {option ? (
                            <>
                              <p className="mt-1 text-xs text-ink-2">
                                운영 {option.open_time}~{option.close_time} · 공백 커버{' '}
                                <span className="font-semibold text-green">{s.startTime}~{s.endTime}</span>
                              </p>
                              {option.address && <p className="mt-1 text-xs text-ink-2">{option.address}</p>}
                              <p className="mt-0.5 text-xs text-ink-2">
                                {days} · 시간당 {option.cost_per_hour === 0 ? '무료' : `${option.cost_per_hour.toLocaleString()}원`}
                              </p>
                            </>
                          ) : (
                            <p className="mt-1 text-xs text-ink-2">{days} · {s.startTime}~{s.endTime}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })()}

            {/* 프리셋: 현재 일정을 이름 붙여 저장하고 나중에 불러오기 */}
            <PresetSection
              draft={draft}
              kids={children}
              onLoad={(items) => {
                if (isDirty && !window.confirm('현재 변경사항을 버리고 프리셋을 불러올까요?')) return
                setDraft(presetItemsToDraft(items, children, tmpId))
                setIsDirty(true)
              }}
            />
          </div>
        </>
      )}
    </div>
  )
}
