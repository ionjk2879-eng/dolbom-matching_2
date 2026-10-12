import type { Ref } from 'react'
import type { Child, RecurringSchedule } from '../data/types'
import { isTouchDevice } from '../data/device'
import { START_HOUR, END_HOUR, SLOTS_PER_DAY, ROW_HEIGHT, slotToTime, childColors } from './weekGridLayout'

export function WeekGridLegend({ schedules, kids }: { schedules: RecurringSchedule[]; kids: Child[] }) {
  return (
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
  )
}

export function WeekGridTimeAxis() {
  return (
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
  )
}

// Right-click menu on a block. bulkCount > 0 when the block is part of a multi-selection.
export function BlockMenu({ menu, menuRef, bulkCount, onEdit, onPunch, onDeleteSelected, onDeleteAll }: {
  menu: { x: number; y: number; slot: number }
  menuRef: Ref<HTMLDivElement>
  bulkCount: number
  onEdit: () => void
  onPunch: () => void
  onDeleteSelected: () => void
  onDeleteAll: () => void
}) {
  return (
    <div
      ref={menuRef}
      className="fixed z-50 overflow-hidden rounded-lg border border-line bg-white shadow-lg"
      style={{ top: menu.y, left: menu.x }}
    >
      <button type="button" className="block w-full px-4 py-2 text-left text-sm hover:bg-ivory" onClick={onEdit}>
        수정
      </button>
      <button type="button" className="block w-full px-4 py-2 text-left text-sm text-error hover:bg-ivory" onClick={onPunch}>
        이 시간만 삭제 ({slotToTime(menu.slot)}~{slotToTime(menu.slot + 1)})
      </button>
      {bulkCount > 0 && (
        <button
          type="button"
          className="block w-full px-4 py-2 text-left text-sm text-error hover:bg-ivory font-semibold"
          onClick={onDeleteSelected}
        >
          선택 {bulkCount}개 모두 삭제
        </button>
      )}
      <button
        type="button"
        className="block w-full px-4 py-2 text-left text-sm text-error hover:bg-ivory opacity-60"
        onClick={onDeleteAll}
      >
        전체 삭제
      </button>
    </div>
  )
}
