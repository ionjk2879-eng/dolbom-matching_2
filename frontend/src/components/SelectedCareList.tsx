import { Link } from 'react-router-dom'
import { careTypeLabels } from '../data/careMatch'
import { WEEKDAY_LABELS } from '../data/date'
import type { CareOption, Child, RecurringSchedule } from '../data/types'

// 선택된 돌봄 센터 목록 — 카드를 누르면 그 아이 탭으로 이동
export function SelectedCareList({
  careList,
  careOptions,
  kids,
  onSelectChild,
}: {
  careList: RecurringSchedule[]
  careOptions?: CareOption[]
  kids: Child[]
  onSelectChild: (childId: string) => void
}) {
  if (careList.length === 0) return null
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold text-ink-2">선택된 돌봄</p>
      <div className="flex flex-col gap-2">
        {careList.map((s) => {
          const option = careOptions?.find((o) => o.id === s.careOptionId)
          const careChild = kids.find((c) => c.id === s.childId)
          const days = [...s.daysOfWeek].sort((a, b) => a - b).map((d) => WEEKDAY_LABELS[d]).join('')
          return (
            <div
              key={s.id}
              className="cursor-pointer rounded-xl border border-green bg-green-soft/20 px-3 py-3 hover:bg-green-soft/40 transition-colors"
              onClick={() => { if (s.childId) onSelectChild(s.childId) }}
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
}
