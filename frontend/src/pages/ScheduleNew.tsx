import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useGoBack } from '../hooks/useGoBack'
import { PageHero } from '../components/PageHero'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Chip } from '../components/Chip'
import { WEEKDAY_LABELS } from '../data/date'
import type { RecurringSchedule, ScheduleType } from '../data/types'
import { useCareScheduleLoading, useCareScheduleStore } from '../store/careScheduleStore'

const typeLabels: Record<ScheduleType, string> = {
  parent_work: '부모 근무',
  child_school: '아이 학교',
  care: '돌봄(선택한 옵션)',
}

// Form state is seeded once from `editing`, so the form mounts only after the schedule has loaded
export function ScheduleNew() {
  const { id } = useParams()
  const loading = useCareScheduleLoading()
  const editing = useCareScheduleStore((s) => s.schedules.find((x) => x.id === id))

  if (id && !editing) {
    if (loading) return <p className="mx-auto max-w-2xl px-4 py-20 text-center text-sm text-ink-2">불러오는 중...</p>
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-sm font-bold text-ink">일정을 찾을 수 없어요</p>
        <Link to="/calendar" className="focus-ring mt-4 inline-block text-sm font-semibold text-green underline">
          내 일정으로 돌아가기
        </Link>
      </div>
    )
  }

  return <ScheduleForm key={id ?? 'new'} editing={editing} />
}

function ScheduleForm({ editing }: { editing: RecurringSchedule | undefined }) {
  const goBack = useGoBack('/calendar')
  const { addSchedule, updateSchedule, children } = useCareScheduleStore()

  const [type, setType] = useState<ScheduleType>(editing?.type ?? 'parent_work')
  const [childId, setChildId] = useState(editing?.childId ?? '')
  const [days, setDays] = useState<number[]>(editing?.daysOfWeek ?? [1, 2, 3, 4, 5])
  const [startTime, setStartTime] = useState(editing?.startTime ?? '09:00')
  const [endTime, setEndTime] = useState(editing?.endTime ?? '18:00')
  const [title, setTitle] = useState(editing?.title ?? '')
  const [memo, setMemo] = useState(editing?.memo ?? '')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const pageTitle = editing ? '일정 수정' : '일정 등록'
  const needsChild = type !== 'parent_work'

  const toggleDay = (d: number) => setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]))

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (days.length === 0) return setError('요일을 하나 이상 선택해주세요')
    if (startTime >= endTime) return setError('종료 시간은 시작 시간보다 늦어야 해요')
    if (needsChild && !childId) return setError('아이를 선택해주세요')

    const data = {
      type,
      childId: needsChild ? childId : null,
      daysOfWeek: days,
      startTime,
      endTime,
      careOptionId: editing?.careOptionId,
      // This form has no mom/dad picker; keep the existing tag so updateSchedule doesn't erase it
      parentLabel: type === 'parent_work' ? editing?.parentLabel : undefined,
      title: title.trim() || undefined,
      memo: memo.trim() || undefined,
    }

    setSubmitting(true)
    setError('')
    const ok = editing ? await updateSchedule(editing.id, data) : await addSchedule(data)
    setSubmitting(false)
    // Return where the user came from, so the form doesn't stay in history behind the calendar
    if (ok) goBack()
  }

  return (
    <div>
      <PageHero title={pageTitle} back="/calendar" breadcrumb={[{ label: '내 일정', to: '/calendar' }, { label: pageTitle }]} />
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Card>
          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
            <label className="text-sm font-semibold text-ink">
              일정 이름 <span className="font-normal text-ink-2">(선택)</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={30}
                placeholder="예: 피아노 학원, 회사"
                className="focus-ring mt-1.5 w-full rounded-xl border border-line-2 bg-ivory-card px-4 py-2.5 text-sm font-normal"
              />
            </label>

            <div>
              <p className="text-sm font-semibold text-ink">유형</p>
              <div className="mt-1.5 inline-flex rounded-xl border border-line bg-ivory-deep-2 p-1">
                {(['parent_work', 'child_school', 'care'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`focus-ring rounded-lg px-4 py-2 text-sm font-semibold ${type === t ? 'bg-ivory text-ink' : 'text-ink-2'}`}
                  >
                    {typeLabels[t]}
                  </button>
                ))}
              </div>
            </div>

            {needsChild && (
              <label className="text-sm font-semibold text-ink">
                아이
                <select
                  value={childId}
                  onChange={(e) => setChildId(e.target.value)}
                  className="focus-ring mt-1.5 w-full rounded-xl border border-line-2 bg-ivory-card px-4 py-2.5 text-sm font-normal"
                >
                  <option value="">아이 선택</option>
                  {children.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <div>
              <p className="text-sm font-semibold text-ink">요일</p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {WEEKDAY_LABELS.map((label, i) => (
                  <Chip key={i} selected={days.includes(i)} onClick={() => toggleDay(i)}>
                    {label}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm font-semibold text-ink">
                시작 시간
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="focus-ring mt-1.5 w-full rounded-xl border border-line-2 bg-ivory-card px-4 py-2.5 text-sm font-normal"
                />
              </label>
              <label className="text-sm font-semibold text-ink">
                종료 시간
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="focus-ring mt-1.5 w-full rounded-xl border border-line-2 bg-ivory-card px-4 py-2.5 text-sm font-normal"
                />
              </label>
            </div>

            <label className="text-sm font-semibold text-ink">
              메모 <span className="font-normal text-ink-2">(선택)</span>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                maxLength={200}
                rows={3}
                placeholder="준비물, 연락처 등"
                className="focus-ring mt-1.5 w-full resize-none rounded-xl border border-line-2 bg-ivory-card px-4 py-2.5 text-sm font-normal"
              />
            </label>
            <p className="-mt-2 text-xs text-ink-2">이름과 메모는 아직 이 브라우저에만 저장돼요.</p>

            {error && <p className="text-sm text-error">{error}</p>}

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={goBack} className="flex-1">
                취소
              </Button>
              <Button type="submit" disabled={submitting} className="flex-1">
                {editing ? '저장' : '등록'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
