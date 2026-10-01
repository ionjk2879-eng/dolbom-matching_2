import { Card } from './Card'
import { overlapWithGap, remainingGap, toMinutes, type Gap } from '../data/gaps'
import { careTypeLabels } from '../data/careMatch'
import type { CareOption, Child } from '../data/types'
import { useCareScheduleStore } from '../store/careScheduleStore'

export function GapMatchPanel({
  child,
  gap,
  options,
  className = '',
}: {
  child: Child
  gap: Gap
  options: CareOption[]
  className?: string
}) {
  const { schedules, addSchedule, removeSchedule } = useCareScheduleStore()

  const candidates = options
    .map((option) => ({ option, overlap: overlapWithGap(option, gap) }))
    .filter((c): c is { option: CareOption; overlap: Gap } => c.overlap !== null)
    .sort((a, b) => {
      const dur = (o: Gap) => toMinutes(o.end) - toMinutes(o.start)
      return dur(b.overlap) - dur(a.overlap)
    })

  const checkedFor = (optionId: string) =>
    schedules.find((s) => s.childId === child.id && s.careOptionId === optionId)

  const checkedOverlaps = candidates
    .filter((c) => checkedFor(c.option.id))
    .map((c) => c.overlap)
  const remaining = remainingGap(gap, checkedOverlaps)
  const gapStart = toMinutes(gap.start)
  const gapLength = toMinutes(gap.end) - gapStart
  const toPercent = (t: string) => ((toMinutes(t) - gapStart) / gapLength) * 100

  const toggle = (option: CareOption, overlap: Gap) => {
    const existing = checkedFor(option.id)
    if (existing) {
      removeSchedule(existing.id)
      return
    }
    const schoolDays =
      schedules.find((s) => s.childId === child.id && s.type === 'child_school')?.daysOfWeek ?? []
    const workDays = schedules.find((s) => s.childId === null && s.type === 'parent_work')?.daysOfWeek ?? []
    const daysOfWeek = schoolDays.filter((d) => workDays.includes(d))
    addSchedule({
      type: 'care',
      childId: child.id,
      careOptionId: option.id,
      daysOfWeek,
      startTime: overlap.start,
      endTime: overlap.end,
    })
  }

  return (
    <Card className={className}>
      <p className="text-sm text-ink">
        <span className="font-bold">{child.name}</span>의 오늘 돌봄 공백{' '}
        <span className="rounded-lg bg-warn-bg px-2 py-1 font-bold text-warn">
          {gap.start}~{gap.end}
        </span>
        에 맞는 돌봄 옵션이에요. 체크해서 조합해보세요.
      </p>

      <div
        className="relative mt-4 h-3 overflow-hidden rounded-full bg-warn-bg"
        role="img"
        aria-label={remaining.length === 0 ? '공백이 모두 커버됨' : '공백 커버 현황'}
      >
        {checkedOverlaps.map((o) => (
          <div
            key={`${o.start}-${o.end}`}
            className="absolute inset-y-0 bg-green"
            style={{ left: `${toPercent(o.start)}%`, width: `${toPercent(o.end) - toPercent(o.start)}%` }}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-ink-3">
        <span>{gap.start}</span>
        <span>{gap.end}</span>
      </div>

      <p className="mt-2 text-xs font-semibold">
        {remaining.length === 0 ? (
          <span className="text-green">공백이 모두 커버됐어요</span>
        ) : (
          <span className="text-ink-3">
            아직 안 채워진 시간: {remaining.map((r) => `${r.start}~${r.end}`).join(', ')}
          </span>
        )}
      </p>

      {candidates.length === 0 && (
        <p className="mt-3 text-sm text-ink-3">이 공백에 맞는 돌봄 옵션을 찾지 못했어요</p>
      )}

      <div className="mt-3 flex flex-col gap-2">
        {candidates.map(({ option, overlap }) => {
          const checked = Boolean(checkedFor(option.id))
          return (
            <label
              key={option.id}
              className={`focus-ring flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                checked ? 'border-green bg-green-soft/40' : 'border-line bg-ivory-card hover:border-green/40'
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(option, overlap)}
                className="mt-1 h-4 w-4 accent-green"
              />
              <div>
                <p className="text-sm font-bold text-ink">
                  {option.name} <span className="font-normal text-ink-3">· {careTypeLabels[option.type]}</span>
                </p>
                <p className="mt-1 text-xs text-ink-2">
                  운영 {option.open_time}~{option.close_time} · 공백 커버{' '}
                  <span className="font-semibold text-green">
                    {overlap.start}~{overlap.end}
                  </span>
                </p>
                <p className="mt-1 text-xs text-ink-3">
                  시간당 {option.cost_per_hour === 0 ? '무료' : `${option.cost_per_hour.toLocaleString()}원`}
                </p>
              </div>
            </label>
          )
        })}
      </div>
    </Card>
  )
}
