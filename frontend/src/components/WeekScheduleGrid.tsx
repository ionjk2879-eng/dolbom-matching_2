import { useEffect, useRef, useState } from 'react'
import { WEEKDAY_LABELS } from '../data/date'
import type { Child, RecurringSchedule } from '../data/types'
import { blockLabel } from '../data/scheduleLabel'
// On touch the grid's drag/right-click/Ctrl don't work: a tap on a block opens its edit form,
// and new blocks come from the editor's add form instead
import { isTouchDevice } from '../data/device'

const START_HOUR = 6
const END_HOUR = 22
const SLOT_MINUTES = 30
const SLOTS_PER_DAY = ((END_HOUR - START_HOUR) * 60) / SLOT_MINUTES
const ROW_HEIGHT = 22

function slotToTime(slot: number): string {
  const mins = START_HOUR * 60 + slot * SLOT_MINUTES
  const h = Math.floor(mins / 60).toString().padStart(2, '0')
  const m = (mins % 60).toString().padStart(2, '0')
  return `${h}:${m}`
}

function timeToSlot(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h * 60 + m - START_HOUR * 60) / SLOT_MINUTES
}

// Blocks reaching outside 06–22 are drawn clipped and can't be dragged: a drag would clamp
// their real times into the window. Edit those through the time form instead.
function fitsWindow(s: { startTime: string; endTime: string }): boolean {
  return timeToSlot(s.startTime) >= 0 && timeToSlot(s.endTime) <= SLOTS_PER_DAY
}

const childColors = ['bg-green text-white', 'bg-sand text-ink', 'bg-warn text-white']

function blockColor(s: RecurringSchedule, kids: Child[]): string {
  if (s.type === 'parent_work') {
    if (s.parentLabel === 'dad') return 'bg-warn text-white'
    if (s.parentLabel === 'mom') return 'bg-ink text-white'
    return 'bg-ink-2 text-white' // untagged
  }
  if (s.type === 'care') return 'bg-line-2 text-ink-2'
  const idx = kids.findIndex((c) => c.id === s.childId)
  return childColors[Math.max(idx, 0) % childColors.length]
}

// Splits a day's blocks into side-by-side lanes so overlapping ones (e.g. school inside work hours) stay visible
function layoutLanes(items: RecurringSchedule[]) {
  const laneEnds: string[] = []
  const laneOf = new Map<string, number>()
  for (const s of [...items].sort((a, b) => a.startTime.localeCompare(b.startTime))) {
    let lane = laneEnds.findIndex((end) => end <= s.startTime)
    if (lane === -1) lane = laneEnds.push(s.endTime) - 1
    else laneEnds[lane] = s.endTime
    laneOf.set(s.id, lane)
  }
  return { laneOf, lanes: Math.max(laneEnds.length, 1) }
}

type Cell = { day: number; slot: number }
type Drag =
  | { kind: 'create'; start: Cell; end: Cell; ctrl: boolean; shift: boolean }
  | { kind: 'move'; id: string; days: number[]; dur: number; offset: number; preview: number; origStart: number; moved: boolean; clickedDay: number }
  | { kind: 'resize'; id: string; days: number[]; startSlot: number; endSlot: number }

export type Target = { type: 'parent'; parentLabel: 'mom' | 'dad' } | { type: 'child'; childId: string }

export function WeekScheduleGrid({
  schedules,
  kids,
  target: _target,
  onCreate,
  onEdit,
  onDelete,
  onPunch,
  onMove,
}: {
  schedules: RecurringSchedule[]
  kids: Child[]
  target: Target
  onCreate: (daysOfWeek: number[], startTime: string, endTime: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onPunch: (id: string, startTime: string, endTime: string) => void
  onMove: (id: string, daysOfWeek: number[], startTime: string, endTime: string) => void
}) {
  const [drag, setDrag] = useState<Drag | null>(null)
  const [sel, setSel] = useState<{ id: string; day: number; slot: number } | null>(null)
  const [multiSel, setMultiSel] = useState<Set<string>>(new Set())
  const [selAnchor, setSelAnchor] = useState<string | null>(null)
  const multiSelRef = useRef<Set<string>>(new Set())
  const schedulesRef = useRef(schedules)
  const [hover, setHover] = useState<Cell | null>(null)
  const [menu, setMenu] = useState<{ id: string; x: number; y: number; slot: number } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const colRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    if (!menu) return
    const close = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenu(null) }
    window.addEventListener('mousedown', close)
    return () => window.removeEventListener('mousedown', close)
  }, [menu])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Backspace while typing in a form field must edit the text, not delete the selected block
      const t = e.target as HTMLElement
      if (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)) return
      if (e.key === 'Escape') { setDrag(null); setSel(null); setMultiSel(new Set()); setSelAnchor(null) }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (multiSel.size > 0) {
          multiSel.forEach((id) => onDelete(id))
          setMultiSel(new Set())
        } else if (sel) {
          onPunch(sel.id, slotToTime(sel.slot), slotToTime(sel.slot + 1))
          setSel(null)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sel, onPunch, multiSel, onDelete])

  useEffect(() => {
    if (!drag) return
    const commit = () => {
      if (drag.kind === 'create') {
        const dayLo = Math.min(drag.start.day, drag.end.day)
        const dayHi = Math.max(drag.start.day, drag.end.day)
        const slotLo = Math.min(drag.start.slot, drag.end.slot)
        const slotHi = Math.max(drag.start.slot, drag.end.slot)
        const days = Array.from({ length: dayHi - dayLo + 1 }, (_, i) => dayLo + i)
        // 단순 클릭: 블록 위면 슬롯 선택, 빈 공간이면 30분 블록 생성
        if (slotLo === slotHi && dayLo === dayHi) {
          const hit = schedules.find(
            (s) => s.daysOfWeek.includes(drag.start.day) &&
              timeToSlot(s.startTime) <= drag.start.slot &&
              timeToSlot(s.endTime) > drag.start.slot
          )
          if (hit) {
            if (drag.shift && selAnchor) {
              const anchor = schedules.find((s) => s.id === selAnchor)
              if (anchor) {
                const lo = anchor.startTime < hit.startTime ? anchor.startTime : hit.startTime
                const hi = anchor.startTime > hit.startTime ? anchor.startTime : hit.startTime
                setSel(null)
                setMultiSel((prev) => {
                  const next = new Set(prev)
                  schedules.forEach((s) => { if (s.startTime >= lo && s.startTime <= hi) next.add(s.id) })
                  return next
                })
              }
            } else if (drag.ctrl) {
              setSel(null)
              setSelAnchor(hit.id)
              setMultiSel((prev) => {
                const next = new Set(prev)
                if (next.has(hit.id)) next.delete(hit.id)
                else next.add(hit.id)
                return next
              })
            } else if (sel?.id === hit.id) {
              setSel(null)
            } else {
              setSel({ id: hit.id, day: drag.start.day, slot: drag.start.slot })
              setSelAnchor(hit.id)
              setMultiSel(new Set())
            }
          } else {
            setSel(null)
            setMultiSel(new Set())
            if (sel === null && multiSel.size === 0) {
              onCreate(days, slotToTime(slotLo), slotToTime(slotLo + 1))
            }
          }
        } else {
          onCreate(days, slotToTime(slotLo), slotToTime(slotHi + 1))
        }
      } else if (drag.kind === 'move') {
        if (drag.moved) {
          const newStart = Math.max(0, Math.min(SLOTS_PER_DAY - drag.dur, drag.preview))
          const delta = newStart - drag.origStart
          const bulk = multiSelRef.current
          if (bulk.size > 1 && bulk.has(drag.id)) {
            bulk.forEach((id) => {
              const s = schedulesRef.current.find((x) => x.id === id)
              if (!s || !fitsWindow(s)) return
              const sStart = timeToSlot(s.startTime)
              const sDur = timeToSlot(s.endTime) - sStart
              const ns = Math.max(0, Math.min(SLOTS_PER_DAY - sDur, sStart + delta))
              onMove(id, s.daysOfWeek, slotToTime(ns), slotToTime(ns + sDur))
            })
          } else {
            onMove(drag.id, drag.days, slotToTime(newStart), slotToTime(newStart + drag.dur))
          }
        } else {
          setSel({ id: drag.id, day: drag.clickedDay, slot: drag.origStart })
          setSelAnchor(drag.id)
        }
      } else if (drag.kind === 'resize') {
        const end = Math.max(drag.startSlot + 1, drag.endSlot)
        const endTime = slotToTime(end)
        const bulk = multiSelRef.current
        if (bulk.size > 1 && bulk.has(drag.id)) {
          bulk.forEach((id) => {
            const s = schedulesRef.current.find((x) => x.id === id)
            if (s && fitsWindow(s)) onMove(id, s.daysOfWeek, s.startTime, endTime)
          })
        } else {
          onMove(drag.id, drag.days, slotToTime(drag.startSlot), endTime)
        }
      }
      setDrag(null)
    }
    window.addEventListener('mouseup', commit)
    return () => window.removeEventListener('mouseup', commit)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag])

  useEffect(() => { multiSelRef.current = multiSel }, [multiSel])
  useEffect(() => { schedulesRef.current = schedules }, [schedules])

  const slotAt = (col: number, clientY: number) => {
    const rect = colRefs.current[col]?.getBoundingClientRect()
    if (!rect) return 0
    return Math.max(0, Math.min(SLOTS_PER_DAY - 1, Math.floor((clientY - rect.top) / ROW_HEIGHT)))
  }

  return (
    <div className="select-none overflow-x-auto">
      <div className="mb-2 flex flex-wrap gap-3 text-xs text-ink-2">
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-ink" /> 엄마 근무</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-warn" /> 아빠 근무</span>
        {schedules.some((s) => s.type === 'parent_work' && !s.parentLabel) && (
          <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-ink-2" /> 부모 근무(미지정 · {isTouchDevice ? '탭' : '우클릭 → 수정'}해서 지정)</span>
        )}
        {kids.map((c, i) => (
          <span key={c.id} className="flex items-center gap-1">
            <span className={`h-3 w-3 rounded ${childColors[i % childColors.length].split(' ')[0]}`} /> {c.name} 학교
          </span>
        ))}
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-line-2" /> 돌봄(선택)</span>
      </div>

      <div className="flex min-w-[640px]">
        <div className="w-14 shrink-0">
          <div style={{ height: ROW_HEIGHT }} />
          <div className="relative" style={{ height: ROW_HEIGHT * SLOTS_PER_DAY }}>
            {Array.from({ length: SLOTS_PER_DAY / 2 + 1 }, (_, i) => (
              START_HOUR + i <= END_HOUR && (
                <div
                  key={i}
                  className="absolute right-1.5 -translate-y-1/2 text-xs leading-none text-ink-2"
                  style={{ top: i * 2 * ROW_HEIGHT }}
                >
                  {String(START_HOUR + i).padStart(2, '0')}:00
                </div>
              )
            ))}
          </div>
        </div>

        {WEEKDAY_LABELS.map((label, day) => (
          <div key={day} className="flex-1 border-l border-line">
            <div style={{ height: ROW_HEIGHT }} className="text-center text-xs font-semibold text-ink-2">{label}</div>
            <div
              ref={(el) => { colRefs.current[day] = el }}
              className="relative border-t border-line"
              style={{ height: ROW_HEIGHT * SLOTS_PER_DAY }}
              onMouseDown={(e) => {
                // A tap fires a synthetic mousedown; don't turn it into a stray 30-minute block
                if (e.button !== 0 || isTouchDevice) return
                setMenu(null)
                const slot = slotAt(day, e.clientY)
                setDrag({ kind: 'create', start: { day, slot }, end: { day, slot }, ctrl: e.ctrlKey || e.metaKey, shift: e.shiftKey })
              }}
              onMouseMove={(e) => {
                const slot = slotAt(day, e.clientY)
                if (!drag) { setHover({ day, slot }); return }
                if (drag.kind === 'create') {
                  setDrag({ ...drag, end: { day, slot } })
                } else if (drag.kind === 'move') {
                  const p = slot - drag.offset
                  setDrag({ ...drag, preview: p, moved: drag.moved || p !== drag.preview })
                } else if (drag.kind === 'resize') {
                  setDrag({ ...drag, endSlot: slot + 1 })
                }
              }}
              onMouseLeave={() => { if (!drag) setHover(null) }}
            >
              {/* 배경 그리드 */}
              {Array.from({ length: SLOTS_PER_DAY }, (_, slot) => (
                <div
                  key={slot}
                  className={`border-b ${slot % 2 === 0 ? 'border-line bg-ivory-card' : 'border-line-3 bg-ivory'}`}
                  style={{ height: ROW_HEIGHT }}
                />
              ))}

              {(() => {
                const dayBlocks = schedules.filter((s) => s.daysOfWeek.includes(day))
                // 돌봄 블록은 layoutLanes에서 제외 — 항상 전체 너비로 표시
                const { laneOf, lanes } = layoutLanes(dayBlocks.filter((s) => s.type !== 'care'))
                return dayBlocks
                  .sort((a, b) => (timeToSlot(b.endTime) - timeToSlot(b.startTime)) - (timeToSlot(a.endTime) - timeToSlot(a.startTime)))
                  .map((s) => {
                    const isMoving = drag?.kind === 'move' && drag.moved && (drag.id === s.id || (multiSel.size > 1 && multiSel.has(drag.id) && multiSel.has(s.id)))
                    const isResizing = drag?.kind === 'resize' && drag.id === s.id
                    const isBulkResizing = drag?.kind === 'resize' && multiSel.size > 1 && multiSel.has(drag.id) && multiSel.has(s.id)
                    const startSlot = timeToSlot(s.startTime)
                    const endSlot = (isResizing || isBulkResizing) ? Math.max(startSlot + 1, drag.endSlot) : timeToSlot(s.endTime)
                    const fits = fitsWindow(s)
                    const top = Math.max(0, startSlot)
                    const bottom = Math.min(SLOTS_PER_DAY, endSlot)
                    const selSlot = sel?.id === s.id && sel?.day === day ? sel.slot : null
                    const isMultiSel = multiSel.has(s.id)
                    const lane = s.type === 'care' ? 0 : (laneOf.get(s.id) ?? 0)
                    const totalLanes = s.type === 'care' ? 1 : lanes
                    return (
                      <div
                        key={s.id}
                        onClick={isTouchDevice ? () => onEdit(s.id) : undefined}
                        onContextMenu={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setSel({ id: s.id, day, slot: slotAt(day, e.clientY) })
                          setMenu({ id: s.id, x: e.clientX, y: e.clientY, slot: slotAt(day, e.clientY) })
                        }}
                        onMouseDown={(e) => {
                          if (e.button !== 0) return
                          if (e.ctrlKey || e.metaKey) return // Ctrl+클릭은 컬럼으로 전파해 다중선택 처리
                          if (e.shiftKey) return // Shift+클릭은 컬럼으로 전파해 범위 선택 처리
                          e.stopPropagation()
                          setMenu(null)
                          setDrag({
                            kind: 'move',
                            id: s.id,
                            days: s.daysOfWeek,
                            dur: timeToSlot(s.endTime) - startSlot,
                            offset: slotAt(day, e.clientY) - startSlot,
                            preview: startSlot,
                            origStart: startSlot,
                            moved: false,
                            clickedDay: day,
                          })
                        }}
                        className={`absolute overflow-hidden rounded text-[10px] font-semibold ${blockColor(s, kids)} ${isMoving ? 'opacity-30' : ''} ${isMultiSel ? 'ring-2 ring-blue-400' : ''}`}
                        style={{
                          top: startSlot * ROW_HEIGHT,
                          height: (endSlot - startSlot) * ROW_HEIGHT,
                          left: `calc(${(lane / totalLanes) * 100}% + 2px)`,
                          width: `calc(${100 / totalLanes}% - 4px)`,
                        }}
                      >
                      {/* 선택된 30분 슬롯 하이라이트 */}
                      {selSlot !== null && (
                        <div
                          className="pointer-events-none absolute inset-x-0 bg-yellow-300/50 ring-1 ring-inset ring-yellow-300"
                          style={{ top: (selSlot - top) * ROW_HEIGHT, height: ROW_HEIGHT }}
                        />
                      )}
                      {/* 상단 grip — 이동 */}
                      {fits && !isTouchDevice && <div
                        className="absolute inset-x-0 top-0 h-3 cursor-grab active:cursor-grabbing hover:bg-white/20"
                        onMouseDown={(e) => {
                          if (e.button !== 0) return
                          e.stopPropagation()
                          setDrag({
                            kind: 'move',
                            id: s.id,
                            days: s.daysOfWeek,
                            dur: timeToSlot(s.endTime) - startSlot,
                            offset: 0,
                            preview: startSlot,
                            origStart: startSlot,
                            moved: false,
                            clickedDay: day,
                          })
                        }}
                      />}
                      {/* 하단 handle — 크기 조절 */}
                      {fits && !isTouchDevice && <div
                        className="absolute inset-x-0 bottom-0 h-2 cursor-ns-resize hover:bg-white/30"
                        onMouseDown={(e) => {
                          if (e.button !== 0) return
                          e.stopPropagation()
                          setDrag({ kind: 'resize', id: s.id, days: s.daysOfWeek, startSlot, endSlot: timeToSlot(s.endTime) })
                        }}
                      />}
                      <div className="pointer-events-none select-none px-1 pt-2 leading-none">
                        <div className="truncate font-semibold">{blockLabel(s, kids)}</div>
                        {(bottom - top) >= 2 && (
                          // Narrow columns: blocks with room wrap the time after "~" instead of cutting it off
                          <div className={`mt-0.5 opacity-75 ${(bottom - top) >= 3 ? '' : 'truncate'}`}>
                            {s.startTime}~<wbr />{isResizing || isBulkResizing ? slotToTime(endSlot) : s.endTime}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                  })
              })()}

              {/* 이동 고스트 */}
              {drag?.kind === 'move' && drag.moved && (() => {
                const delta = drag.preview - drag.origStart
                const isBulk = multiSel.size > 1 && multiSel.has(drag.id)
                const ghostIds = isBulk ? [...multiSel] : [drag.id]
                return ghostIds.map((gid) => {
                  const s = schedules.find((x) => x.id === gid)
                  if (!s?.daysOfWeek.includes(day)) return null
                  const sStart = timeToSlot(s.startTime)
                  const sDur = timeToSlot(s.endTime) - sStart
                  const p = Math.max(0, Math.min(SLOTS_PER_DAY - sDur, isBulk ? sStart + delta : drag.preview))
                  return (
                    <div
                      key={gid}
                      className={`pointer-events-none absolute inset-x-0.5 z-20 rounded px-1 pt-3 text-xs font-semibold ring-2 ring-inset ring-white/60 ${blockColor(s, kids)}`}
                      style={{ top: p * ROW_HEIGHT, height: sDur * ROW_HEIGHT }}
                    >
                      <span className="pointer-events-none select-none">
                        {blockLabel(s, kids)} {slotToTime(p)}~{slotToTime(p + sDur)}
                      </span>
                    </div>
                  )
                })
              })()}

              {/* 드래그 생성 오버레이 */}
              {drag?.kind === 'create' && (() => {
                const dayLo = Math.min(drag.start.day, drag.end.day)
                const dayHi = Math.max(drag.start.day, drag.end.day)
                if (day < dayLo || day > dayHi) return null
                const slotLo = Math.min(drag.start.slot, drag.end.slot)
                const slotHi = Math.max(drag.start.slot, drag.end.slot)
                if (slotLo === slotHi && dayLo === dayHi) return null
                return (
                  <div
                    className="pointer-events-none absolute inset-x-0 z-10 rounded bg-green/20 outline outline-2 -outline-offset-1 outline-green/60"
                    style={{ top: slotLo * ROW_HEIGHT, height: (slotHi - slotLo + 1) * ROW_HEIGHT }}
                  />
                )
              })()}

              {/* 호버 표시 */}
              {!drag && hover?.day === day && (
                <div
                  className="pointer-events-none absolute inset-x-0 z-10 bg-ink/5"
                  style={{ top: hover.slot * ROW_HEIGHT, height: ROW_HEIGHT }}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {multiSel.size > 1 && (
        <p className="mt-2 text-xs text-blue-500">
          {multiSel.size}개 선택됨 — 아무 블록 하단 바 드래그 → 종료 시간 일괄 조절 · Escape → 해제
        </p>
      )}

      <p className="mt-2 text-xs text-ink-2">
        {isTouchDevice
          ? '블록을 탭하면 시간 수정·삭제 · 새 일정은 위 ‘일정 추가’로 등록'
          : '클릭/드래그 → 등록 · Ctrl+클릭 → 다중선택 · 블록 클릭 → 슬롯 선택(Delete 삭제) · 블록 상단 드래그 → 이동 · 블록 하단 드래그 → 크기 조절 · 우클릭 → 수정/삭제'}
      </p>

      {menu && (
        <div
          ref={menuRef}
          className="fixed z-50 overflow-hidden rounded-lg border border-line bg-white shadow-lg"
          style={{ top: menu.y, left: menu.x }}
        >
          <button
            type="button"
            className="block w-full px-4 py-2 text-left text-sm hover:bg-ivory"
            onClick={() => { onEdit(menu.id); setMenu(null) }}
          >
            수정
          </button>
          <button
            type="button"
            className="block w-full px-4 py-2 text-left text-sm text-error hover:bg-ivory"
            onClick={() => { onPunch(menu.id, slotToTime(menu.slot), slotToTime(menu.slot + 1)); setMenu(null); setSel(null) }}
          >
            이 시간만 삭제 ({slotToTime(menu.slot)}~{slotToTime(menu.slot + 1)})
          </button>
          {multiSel.size > 1 && multiSel.has(menu.id) && (
            <button
              type="button"
              className="block w-full px-4 py-2 text-left text-sm text-error hover:bg-ivory font-semibold"
              onClick={() => { multiSel.forEach((id) => onDelete(id)); setMultiSel(new Set()); setMenu(null) }}
            >
              선택 {multiSel.size}개 모두 삭제
            </button>
          )}
          <button
            type="button"
            className="block w-full px-4 py-2 text-left text-sm text-error hover:bg-ivory opacity-60"
            onClick={() => { onDelete(menu.id); setMenu(null) }}
          >
            전체 삭제
          </button>
        </div>
      )}
    </div>
  )
}
