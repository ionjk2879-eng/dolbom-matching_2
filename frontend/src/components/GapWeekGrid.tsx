import type { Child, RecurringSchedule } from '../data/types'
import { computeGaps } from '../data/gaps'
import { WEEKDAY_LABELS } from '../data/date'

const START_HOUR = 6
const END_HOUR = 22
const SLOTS_PER_DAY = ((END_HOUR - START_HOUR) * 60) / 30
const ROW_HEIGHT = 22

// 예외 일정 없이 순수 반복 패턴만 보기 위한 기준 주 (2025-01-05 일 ~ 2025-01-11 토)
const REF = ['2025-01-05','2025-01-06','2025-01-07','2025-01-08','2025-01-09','2025-01-10','2025-01-11']

// Display only: clipped to the visible 06–22 window so early/late blocks don't spill out of the grid
function timeToSlot(t: string) {
  const [h, m] = t.split(':').map(Number)
  return Math.min(SLOTS_PER_DAY, Math.max(0, (h * 60 + m - START_HOUR * 60) / 30))
}

// 아이별 공백 색상 — warn(주황갈색) vs green(짙은 초록)으로 명확히 구분
const GAP_COLORS = ['bg-warn text-white', 'bg-green text-white']
// 학교 블록 참고용 — 연하게
const SCHOOL_BG = ['bg-green/20', 'bg-sand/40']

export function GapWeekGrid({
  kids: children,
  schedules,
}: {
  kids: Child[]
  schedules: RecurringSchedule[]
}) {
  const hasParentWork = schedules.some((s) => s.type === 'parent_work')
  const hasChildSchool = schedules.some((s) => s.type === 'child_school')

  if (children.length === 0 || !hasParentWork || !hasChildSchool) {
    return (
      <p className="text-sm text-ink-2">
        부모 근무 + 아이 학교 일정을 모두 등록하면 주간 돌봄 공백 패턴이 여기에 표시돼요.
      </p>
    )
  }

  // 아이별 × 요일별 공백
  const gapsByChildDay = children.map((child) =>
    REF.map((date) => computeGaps(child, date, schedules, []))
  )

  // 부모 근무 참고 블록
  const parentWorkByDay = REF.map((date) => {
    const dow = new Date(`${date}T00:00:00`).getDay()
    return schedules
      .filter((s) => s.type === 'parent_work' && s.daysOfWeek.includes(dow))
      .map((s) => ({ start: timeToSlot(s.startTime), end: timeToSlot(s.endTime) }))
  })

  // 아이 학교 참고 블록
  const schoolByChildDay = children.map((child) =>
    REF.map((date) => {
      const dow = new Date(`${date}T00:00:00`).getDay()
      return schedules
        .filter((s) => s.childId === child.id && s.type === 'child_school' && s.daysOfWeek.includes(dow))
        .map((s) => ({ start: timeToSlot(s.startTime), end: timeToSlot(s.endTime) }))
    })
  )

  // 선택된 돌봄 블록
  const careByChildDay = children.map((child) =>
    REF.map((date) => {
      const dow = new Date(`${date}T00:00:00`).getDay()
      return schedules
        .filter((s) => s.childId === child.id && s.type === 'care' && s.daysOfWeek.includes(dow))
        .map((s) => ({ start: timeToSlot(s.startTime), end: timeToSlot(s.endTime), title: s.title ?? '돌봄', startTime: s.startTime, endTime: s.endTime }))
    })
  )

  const n = children.length

  return (
    <div className="select-none">
      {/* 범례 */}
      <div className="mb-2 flex flex-wrap gap-3 text-xs text-ink-2">
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-ink/20" /> 부모 근무
        </span>
        {children.map((c, i) => (
          <span key={`school-${c.id}`} className="flex items-center gap-1">
            <span className={`h-3 w-3 rounded ${SCHOOL_BG[i % SCHOOL_BG.length]}`} /> {c.name} 학교
          </span>
        ))}
        {children.map((c, i) => (
          <span key={`gap-${c.id}`} className="flex items-center gap-1">
            <span className={`h-3 w-3 rounded ${GAP_COLORS[i % GAP_COLORS.length].split(' ')[0]}`} /> {c.name} 돌봄 공백
          </span>
        ))}
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-green" /> 선택한 돌봄
        </span>
      </div>

      <div className="flex">
        {/* 시간 레이블 */}
        <div className="w-14 shrink-0">
          <div style={{ height: ROW_HEIGHT }} />
          <div className="relative" style={{ height: ROW_HEIGHT * SLOTS_PER_DAY }}>
            {Array.from({ length: SLOTS_PER_DAY / 2 + 1 }, (_, i) =>
              START_HOUR + i <= END_HOUR && (
                <div
                  key={i}
                  className="absolute right-1.5 -translate-y-1/2 text-xs leading-none text-ink-2"
                  style={{ top: i * 2 * ROW_HEIGHT }}
                >
                  {String(START_HOUR + i).padStart(2, '0')}:00
                </div>
              )
            )}
          </div>
        </div>

        {WEEKDAY_LABELS.map((label, day) => (
          <div key={day} className="flex-1 border-l border-line">
            <div style={{ height: ROW_HEIGHT }} className="text-center text-xs font-semibold text-ink-2">
              {label}
            </div>
            <div className="relative border-t border-line" style={{ height: ROW_HEIGHT * SLOTS_PER_DAY }}>
              {/* 배경 그리드 */}
              {Array.from({ length: SLOTS_PER_DAY }, (_, slot) => (
                <div
                  key={slot}
                  className={`border-b ${slot % 2 === 0 ? 'border-line bg-ivory-card' : 'border-line-3 bg-ivory'}`}
                  style={{ height: ROW_HEIGHT }}
                />
              ))}

              {/* 부모 근무 참고 */}
              {parentWorkByDay[day].map((b, i) => (
                <div
                  key={i}
                  className="pointer-events-none absolute inset-x-0 bg-ink/15"
                  style={{ top: b.start * ROW_HEIGHT, height: (b.end - b.start) * ROW_HEIGHT }}
                />
              ))}

              {/* 아이 학교 참고 */}
              {children.map((_child, ci) =>
                schoolByChildDay[ci][day].map((b, i) => (
                  <div
                    key={`school-${ci}-${i}`}
                    className={`pointer-events-none absolute inset-x-0.5 rounded ${SCHOOL_BG[ci % SCHOOL_BG.length]}`}
                    style={{ top: b.start * ROW_HEIGHT, height: (b.end - b.start) * ROW_HEIGHT }}
                  />
                ))
              )}

              {/* 선택한 돌봄 */}
              {children.map((_child, ci) =>
                careByChildDay[ci][day].map((c, i) => (
                  <div
                    key={`care-${ci}-${i}`}
                    className="pointer-events-none absolute inset-x-0.5 overflow-hidden rounded bg-green text-xs font-semibold text-white"
                    style={{ top: c.start * ROW_HEIGHT, height: (c.end - c.start) * ROW_HEIGHT }}
                  >
                    <span className="block break-keep px-1 pt-1 leading-tight">{c.title}</span>
                    {(c.end - c.start) >= 2 && (
                      <span className="block px-1 opacity-80">{c.startTime}~<wbr />{c.endTime}</span>
                    )}
                  </div>
                ))
              )}

              {/* 돌봄 공백 — 아이가 여럿이면 나란히 */}
              {children.map((child, ci) =>
                gapsByChildDay[ci][day].map((gap, gi) => {
                  const start = timeToSlot(gap.start)
                  const end = timeToSlot(gap.end)
                  const colW = 100 / n
                  return (
                    <div
                      key={`gap-${ci}-${gi}`}
                      className={`pointer-events-none absolute overflow-hidden rounded text-xs font-semibold ${GAP_COLORS[ci % GAP_COLORS.length]}`}
                      style={{
                        top: start * ROW_HEIGHT,
                        height: (end - start) * ROW_HEIGHT,
                        left: `calc(${ci * colW}% + 2px)`,
                        width: `calc(${colW}% - 4px)`,
                      }}
                    >
                      <span className="block truncate px-1 pt-1">{child.name}</span>
                      {(end - start) >= 2 && (
                        <span className={`block px-1 opacity-80 ${(end - start) >= 3 ? '' : 'truncate'}`}>{gap.start}~<wbr />{gap.end}</span>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
