import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Button } from './Button'
import { WeekScheduleGrid, type Target } from './WeekScheduleGrid'
import { isTouchDevice } from '../data/device'
import { GapWeekGrid } from './GapWeekGrid'
import { GapCalendarTab } from './GapCalendarTab'
import { ScheduleEditForm } from './ScheduleEditForm'
import { ScheduleAddForm } from './ScheduleAddForm'
import { PresetSection } from './PresetSection'
import { SelectedCareList } from './SelectedCareList'
import { useCareScheduleStore } from '../store/careScheduleStore'
import { useMatchStore } from '../store/matchStore'
import { REGIONS } from '../data/careMatch'
import { DISTRICTS } from '../data/districts'
import { ChildManager } from './ChildManager'
import { toISO } from '../data/date'
import type { CareOption, RecurringSchedule } from '../data/types'
import { presetItemsToDraft, draftToPresetItems, loadPresets, upsertPreset, deletePreset, type Preset } from '../data/presets'

// 아이 등록 + 부모/아이 반복 일정 캘린더. GapSetup 페이지와 Home 메인페이지에서 공용으로 쓴다.
export function CareScheduleEditor({ careOptions }: { careOptions?: CareOption[] } = {}) {
  const { children, schedules: allSchedules, addSchedule, removeSchedule, updateSchedule } = useCareScheduleStore()

  const serverSchedules = allSchedules.filter((s) => !s.date && s.type !== 'care')
  const careSchedules = allSchedules.filter((s) => s.type === 'care' && !s.date)

  // Color preview while editing (local only — not sent to server until form save)
  const [colorOverrides, setColorOverrides] = useState<Map<string, string | undefined>>(new Map())
  const schedules = [...serverSchedules, ...careSchedules].map((s) =>
    colorOverrides.has(s.id) ? { ...s, color: colorOverrides.get(s.id) } : s
  )

  const match = useMatchStore()
  const [view, setView] = useState<'schedule' | 'gap' | 'calendar'>('schedule')
  const [target, setTarget] = useState<Target>({ type: 'parent', parentLabel: 'mom' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [presetOpen, setPresetOpen] = useState(false)
  const [presets, setPresets] = useState<Preset[]>(() => loadPresets())
  const [showSaveInput, setShowSaveInput] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [activePresetName, setActivePresetName] = useState<string | null>(null)
  const editOriginalColorsRef = useRef<Map<string, string | undefined>>(new Map())
  const [multiSelIds, setMultiSelIds] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState(() => toISO(new Date()))

  const cancelEdit = () => setEditingId(null)

  // Clear color overrides whenever edit form closes
  useEffect(() => {
    if (!editingId) setColorOverrides(new Map())
  }, [editingId])

  useEffect(() => {
    if (!editingId) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') cancelEdit() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingId])

  const type = target.type === 'parent' ? 'parent_work' as const : 'child_school' as const
  const childId = target.type === 'child' ? target.childId : null
  const parentLabel = target.type === 'parent' ? target.parentLabel : undefined

  const activeSchedules = schedules.filter((s) =>
    target.type === 'parent'
      ? s.type === 'parent_work' && (s.parentLabel === parentLabel || (!s.parentLabel && parentLabel === 'mom'))
      : (s.type === 'child_school' || s.type === 'care') && s.childId === target.childId
  )

  const handleSavePreset = () => {
    if (!saveName.trim()) return
    const p: Preset = {
      id: Math.random().toString(36).slice(2),
      name: saveName.trim(),
      createdAt: new Date().toISOString(),
      items: draftToPresetItems(serverSchedules, children),
      region: match.region || undefined,
      district: match.district || undefined,
    }
    upsertPreset(p)
    setPresets(loadPresets())
    setSaveName('')
    setShowSaveInput(false)
  }

  const handleLoadPreset = async (preset: Preset) => {
    const careToRemove = allSchedules.filter((s) => s.type === 'care' && !s.date)
    const recurringToRemove = allSchedules.filter((s) => !s.date && s.type !== 'care')
    const needsConfirm = recurringToRemove.length > 0 || careToRemove.length > 0
    if (needsConfirm && !window.confirm('현재 일정(맞춤센터 포함)을 초기화하고 프리셋을 불러올까요?')) return
    await Promise.all([
      ...careToRemove.map((s) => removeSchedule(s.id)),
      ...recurringToRemove.map((s) => removeSchedule(s.id)),
    ])
    const newItems = presetItemsToDraft(preset.items, children, () => Math.random().toString(36).slice(2))
    await Promise.all(newItems.map((s) => { const { id: _id, ...rest } = s; return addSchedule(rest) }))
    match.setRegion(preset.region ?? '')
    match.setDistrict(preset.district ?? '')
    setActivePresetName(preset.name)
    setPresetOpen(false)
  }

  // Grid callbacks — all write directly to server

  const onCreate = (daysOfWeek: number[], startTime: string, endTime: string) => {
    const overlapIds = new Set(
      serverSchedules
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
    const overlapping = serverSchedules.filter((s) => overlapIds.has(s.id))
    const remnants = overlapping.flatMap((s) =>
      s.daysOfWeek
        .filter((d) => !daysOfWeek.includes(d))
        .map((d) => { const { id: _id, ...rest } = s; return { ...rest, daysOfWeek: [d] } }),
    )
    const newBlocks = daysOfWeek.map(
      (day) =>
        ({
          type,
          childId,
          daysOfWeek: [day],
          startTime,
          endTime,
          parentLabel,
        }) as Omit<RecurringSchedule, 'id'>,
    )
    void Promise.all(overlapping.map((s) => removeSchedule(s.id)))
      .then(() => Promise.all([...remnants.map((r) => addSchedule(r)), ...newBlocks.map((b) => addSchedule(b))]))
    setActivePresetName(null)
  }

  const onPunch = (id: string, punchStart: string, punchEnd: string) => {
    const s = schedules.find((x) => x.id === id)
    if (!s) return
    if (s.type === 'care') { void removeSchedule(id); return }
    const { id: _id, ...rest } = s
    const rem: Omit<RecurringSchedule, 'id'>[] = []
    if (s.startTime < punchStart) rem.push({ ...rest, endTime: punchStart })
    if (s.endTime > punchEnd) rem.push({ ...rest, startTime: punchEnd })
    void removeSchedule(id).then(() => Promise.all(rem.map((r) => addSchedule(r))))
    setActivePresetName(null)
  }

  const onMove = (id: string, daysOfWeek: number[], startTime: string, endTime: string) => {
    const s = schedules.find((x) => x.id === id)
    if (!s) return
    const { id: _id, ...rest } = s
    void updateSchedule(id, { ...rest, daysOfWeek, startTime, endTime })
    setActivePresetName(null)
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

          <div className="flex flex-wrap items-start gap-x-8 gap-y-3">
            {/* 거주지 */}
            <div className="flex flex-col gap-3">
              <p className="text-sm font-bold text-ink">거주지</p>
              <div className="flex flex-wrap gap-2">
                <select
                  aria-label="시/도"
                  value={match.region}
                  onChange={(e) => { match.setRegion(e.target.value); setActivePresetName(null) }}
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
                  onChange={(e) => { match.setDistrict(e.target.value); setActivePresetName(null) }}
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

            {/* 프리셋 — 드롭다운 + 저장 버튼 나란히 */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold text-ink">프리셋</p>
                {activePresetName && (
                  <span className="rounded-full bg-green-soft px-2 py-0.5 text-xs font-semibold text-green">{activePresetName}</span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {/* 선택 드롭다운 */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setPresetOpen((v) => !v)}
                    className="focus-ring flex items-center gap-2 rounded-lg border border-line-2 bg-ivory-card px-3 py-2 text-sm text-ink-2"
                  >
                    프리셋 선택
                    <span className="text-xs">{presetOpen ? '▲' : '▼'}</span>
                  </button>
                  {presetOpen && (
                    <div className="absolute left-0 top-full z-20 mt-1 w-56 rounded-xl border border-line bg-ivory-card p-3 shadow-lg">
                      <PresetSection
                        presets={presets}
                        draft={serverSchedules}
                        kids={children}
                        onLoad={handleLoadPreset}
                        onUpdate={(p) => { upsertPreset(p); setPresets(loadPresets()) }}
                        onDelete={(id) => { deletePreset(id); setPresets(loadPresets()) }}
                      />
                    </div>
                  )}
                </div>
                {/* 저장 — 드롭다운 옆 */}
                {showSaveInput ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="프리셋 이름"
                      value={saveName}
                      onChange={(e) => setSaveName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSavePreset() } }}
                      autoFocus
                      className="focus-ring w-36 rounded-lg border border-line-2 bg-ivory-card px-3 py-2 text-sm"
                    />
                    <Button type="button" onClick={handleSavePreset} disabled={!saveName.trim()}>저장</Button>
                    <button type="button" onClick={() => { setShowSaveInput(false); setSaveName('') }} className="focus-ring text-xs font-semibold text-ink-2">취소</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setShowSaveInput(true)} className="focus-ring text-xs font-semibold text-green">
                    + 현재 일정을 프리셋으로 저장
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-sm font-bold text-ink">반복 일정 캘린더</p>
            <div className="flex flex-wrap items-center gap-2">
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
              onEdit={(id) => {
                const ids = multiSelIds.length > 1 ? multiSelIds : [id]
                editOriginalColorsRef.current = new Map(ids.map((sid) => [sid, schedules.find((s) => s.id === sid)?.color]))
                setEditingId(id)
              }}
              onDelete={(id) => void removeSchedule(id)}
              onPunch={onPunch}
              onMove={onMove}
              onSelectionChange={setMultiSelIds}
            />
            {editingId && (() => {
              const schedule = schedules.find((s) => s.id === editingId)
              if (!schedule) return null
              return createPortal(
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
                  onClick={cancelEdit}
                >
                  <div
                    className="mx-4 w-full max-w-sm rounded-2xl bg-ivory-card p-4 shadow-xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ScheduleEditForm
                      key={editingId}
                      schedule={schedule}
                      onClose={() => setEditingId(null)}
                      onColorPreview={(id, color) => {
                        const ids = multiSelIds.length > 1 ? multiSelIds : [id]
                        setColorOverrides((prev) => {
                          const next = new Map(prev)
                          ids.forEach((sid) => next.set(sid, color))
                          return next
                        })
                      }}
                      onSave={(id, data) => {
                        const saveOne = (sid: string, sdata: Omit<RecurringSchedule, 'id'>) => {
                          if (!schedules.find((x) => x.id === sid)) return
                          void updateSchedule(sid, sdata)
                          setActivePresetName(null)
                        }
                        saveOne(id, data)
                        const origColor = editOriginalColorsRef.current.get(id)
                        if (multiSelIds.length > 1 && data.color !== origColor) {
                          multiSelIds.filter((sid) => sid !== id).forEach((sid) => {
                            const ms = schedules.find((x) => x.id === sid)
                            if (!ms) return
                            const { id: _msId, ...msRest } = ms
                            saveOne(sid, { ...msRest, color: data.color })
                          })
                        }
                      }}
                      onRemove={(id) => { void removeSchedule(id); setEditingId(null) }}
                    />
                  </div>
                </div>,
                document.body
              )
            })()}

            <SelectedCareList
              careList={schedules.filter((s) => s.type === 'care')}
              careOptions={careOptions}
              kids={children}
              onSelectChild={(id) => setTarget({ type: 'child', childId: id })}
            />


          </div>
        </>
      )}
    </div>
  )
}
