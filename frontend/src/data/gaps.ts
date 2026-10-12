import type { CareOption, Child, RecurringSchedule, ScheduleException } from './types'

type Interval = { start: number; end: number } // minutes from midnight

export function toMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export function toTime(mins: number): string {
  const h = Math.floor(mins / 60).toString().padStart(2, '0')
  const m = (mins % 60).toString().padStart(2, '0')
  return `${h}:${m}`
}

// A one-time schedule (date set) happens only on that date; others repeat on their weekdays
export function occursOn(schedule: RecurringSchedule, date: string): boolean {
  if (schedule.date) return schedule.date === date
  return schedule.daysOfWeek.includes(new Date(`${date}T00:00:00`).getDay())
}

// Resolves one schedule's interval for a specific date, applying exceptions.
// Returns null if the schedule doesn't apply that day (wrong weekday, cancelled).
function resolveInterval(
  schedule: RecurringSchedule,
  date: string,
  exceptions: ScheduleException[],
): Interval | null {
  const exception = exceptions.find((e) => e.scheduleId === schedule.id && e.date === date)
  if (exception?.isCancelled) return null
  if (!exception && !occursOn(schedule, date)) return null
  const start = exception?.startTime ?? schedule.startTime
  const end = exception?.endTime ?? schedule.endTime
  return { start: toMinutes(start), end: toMinutes(end) }
}

// Subtracts `covered` intervals from `busy` intervals.
export function subtract(busy: Interval[], covered: Interval[]): Interval[] {
  let result = busy
  for (const c of covered) {
    const next: Interval[] = []
    for (const b of result) {
      if (c.end <= b.start || c.start >= b.end) {
        next.push(b) // no overlap
        continue
      }
      if (c.start > b.start) next.push({ start: b.start, end: Math.min(c.start, b.end) })
      if (c.end < b.end) next.push({ start: Math.max(c.end, b.start), end: b.end })
    }
    result = next.filter((i) => i.end > i.start)
  }
  return result
}

// Sorts and unions overlapping/touching intervals so the same time never yields two gaps
function merge(intervals: Interval[]): Interval[] {
  const result: Interval[] = []
  for (const i of [...intervals].sort((a, b) => a.start - b.start)) {
    const last = result[result.length - 1]
    if (last && i.start <= last.end) last.end = Math.max(last.end, i.end)
    else result.push({ ...i })
  }
  return result
}

function intersect(a: Interval[], b: Interval[]): Interval[] {
  const result: Interval[] = []
  for (const x of a) {
    for (const y of b) {
      const start = Math.max(x.start, y.start)
      const end = Math.min(x.end, y.end)
      if (start < end) result.push({ start, end })
    }
  }
  return result
}

export type Gap = { start: string; end: string }

// 돌봄 공백 = 부모가 근무 중(parent_work)인데 아이가 학교/돌봄(child_school, care)으로
// 커버되지 않는 시간. child_school은 통학시간만큼 커버 종료 시각을 늦춰 계산한다.
// 예: 아이 학교 09:00~15:00 + 통학 20분, 부모 근무 09:00~18:30 -> 공백 15:20~18:30
export function computeGaps(
  child: Child,
  date: string,
  schedules: RecurringSchedule[],
  exceptions: ScheduleException[],
): Gap[] {
  const resolve = (s: RecurringSchedule) => resolveInterval(s, date, exceptions)

  const momWork = schedules
    .filter((s) => s.type === 'parent_work' && s.parentLabel === 'mom' && s.childId === null)
    .map(resolve).filter((i): i is Interval => i !== null)
  const dadWork = schedules
    .filter((s) => s.type === 'parent_work' && s.parentLabel === 'dad' && s.childId === null)
    .map(resolve).filter((i): i is Interval => i !== null)
  const untaggedWork = schedules
    .filter((s) => s.type === 'parent_work' && !s.parentLabel && s.childId === null)
    .map(resolve).filter((i): i is Interval => i !== null)

  // 맞벌이(엄마+아빠 둘 다 등록): 동시에 근무하는 시간만 공백 후보.
  // 등록 여부는 그날이 아니라 가족 기준으로 본다 — 아빠가 쉬는 날이면 엄마만 근무해도 공백 없음 (GapMatchPanel과 같은 기준)
  // 누구 것인지 모르는 근무(태그는 localStorage라 다른 기기/예전 일정은 태그 없음)는 놓치지 않게 항상 포함
  // One-time work doesn't make a family dual-income (it would hide gaps on every other day)
  const isWork = (s: RecurringSchedule, label: 'mom' | 'dad') =>
    s.type === 'parent_work' && s.parentLabel === label && s.childId === null && !s.date
  const dualIncome = schedules.some((s) => isWork(s, 'mom')) && schedules.some((s) => isWork(s, 'dad'))
  // dualIncome이면 교집합만 사용 — untagged(구형 데이터)가 19:00짜리로 남아있어도 오염되지 않음
  const parentBusy: Interval[] = dualIncome
    ? intersect(momWork, dadWork)
    : [...momWork, ...dadWork, ...untaggedWork]

  const childCovered = schedules
    .filter((s) => s.childId === child.id && (s.type === 'child_school' || s.type === 'care'))
    .map((s) => {
      const interval = resolveInterval(s, date, exceptions)
      if (!interval) return null
      const commuteBuffer = s.type === 'child_school' ? child.commuteMinutes : 0
      // 등교 전 통학 시간도 커버에 포함: 아이가 집을 나서는 시각부터 귀가까지
      return { start: Math.max(0, interval.start - commuteBuffer), end: interval.end + commuteBuffer }
    })
    .filter((i): i is Interval => i !== null)

  const firstCover = childCovered.length > 0 ? Math.min(...childCovered.map((c) => c.start)) : 0

  return subtract(merge(parentBusy), childCovered)
    .filter((i) => i.end - i.start > child.commuteMinutes)
    .filter((i) => i.end > firstCover)
    .sort((a, b) => a.start - b.start)
    .map((i) => ({ start: toTime(i.start), end: toTime(i.end) }))
}

// 돌봄 옵션의 운영시간이 공백과 겹치는 구간. 안 겹치면 null.
export function overlapWithGap(option: CareOption, gap: Gap): Gap | null {
  const start = Math.max(toMinutes(gap.start), toMinutes(option.open_time))
  const end = Math.min(toMinutes(gap.end), toMinutes(option.close_time))
  if (start >= end) return null
  return { start: toTime(start), end: toTime(end) }
}

// 공백에서 이미 선택한(체크된) 옵션들의 커버 구간을 뺀 나머지
export function remainingGap(gap: Gap, covered: Gap[]): Gap[] {
  return subtract(
    [{ start: toMinutes(gap.start), end: toMinutes(gap.end) }],
    covered.map((c) => ({ start: toMinutes(c.start), end: toMinutes(c.end) })),
  ).map((i) => ({ start: toTime(i.start), end: toTime(i.end) }))
}
