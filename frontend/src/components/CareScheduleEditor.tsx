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
import { presetItemsToDraft } from '../data/presets'

// Temporary IDs for draft-only schedules (never sent to server until save)
const tmpId = () => `__${Math.random().toString(36).slice(2, 9)}`
const isTemp = (id: string) => id.startsWith('__')

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
  const editOriginalColorsRef = useRef<Map<string, string | undefined>>(new Map())
  const [multiSelIds, setMultiSelIds] = useState<string[]>([])

  const cancelEdit = () => {
    if (editingId) {
      const orig = editOriginalColorsRef.current
      setDraft((prev) => prev.map((s) => orig.has(s.id) ? { ...s, color: orig.get(s.id) } : s))
    }
    setEditingId(null)
  }

  useEffect(() => {
    if (!editingId) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') cancelEdit() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingId])
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
              onEdit={(id) => {
                const ids = multiSelIds.length > 1 ? multiSelIds : [id]
                editOriginalColorsRef.current = new Map(ids.map((sid) => [sid, schedules.find((s) => s.id === sid)?.color]))
                setEditingId(id)
              }}
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
                        setDraft((prev) => prev.map((s) => ids.includes(s.id) ? { ...s, color } : s))
                      }}
                      onSave={(id, data) => {
                        // Non-temp (existing server) schedules auto-save immediately
                        const saveOne = (sid: string, sdata: Omit<RecurringSchedule, 'id'>) => {
                          const existing = schedules.find((x) => x.id === sid)
                          if (!existing) return
                          if (existing.type === 'care' || !isTemp(sid)) {
                            updateSchedule(sid, sdata)
                            if (existing.type !== 'care') {
                              // sync draft silently (no isDirty) so handleSave diff stays clean
                              setDraft((prev) => prev.map((d) => d.id === sid ? { ...sdata, id: sid } : d))
                            }
                          } else {
                            draftUpdate(sid, sdata)
                          }
                        }
                        saveOne(id, data)
                        // Multi-select: propagate color change to all selected
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
                      onRemove={(id) => {
                        const s = schedules.find((x) => x.id === id)
                        if (s?.type === 'care') removeSchedule(id)
                        else draftRemove(id)
                      }}
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

            {/* 프리셋: 현재 일정을 이름 붙여 저장하고 나중에 불러오기 */}
            <PresetSection
              draft={draft}
              kids={children}
              onLoad={(preset) => {
                if (isDirty && !window.confirm('현재 변경사항을 버리고 프리셋을 불러올까요?')) return
                setDraft(presetItemsToDraft(preset.items, children, tmpId))
                match.setRegion(preset.region ?? '')
                match.setDistrict(preset.district ?? '')
                setIsDirty(true)
              }}
            />

          </div>
        </>
      )}
    </div>
  )
}
