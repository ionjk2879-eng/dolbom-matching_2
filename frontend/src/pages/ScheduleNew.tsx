import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { PageHero } from '../components/PageHero'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { RepeatFields } from '../components/RepeatFields'
import { noRepeat, repeatDates, type Repeat } from '../data/repeat'
import { centers } from '../data/centers'
import { useScheduleStore } from '../store/scheduleStore'

const inputClass = 'focus-ring mt-1.5 w-full rounded-xl border border-line-2 bg-ivory-card px-4 py-2.5 text-sm font-normal'

export function ScheduleNew() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { id } = useParams()
  const { addSchedule, addRepeating, updateSchedule } = useScheduleStore()
  const editing = useScheduleStore((s) => s.schedules.find((x) => x.id === id))
  const [title, setTitle] = useState(editing?.title ?? '')
  const [date, setDate] = useState(editing?.date ?? params.get('date') ?? '')
  const [start, setStart] = useState(editing?.start ?? '')
  const [end, setEnd] = useState(editing?.end ?? '')
  const [centerId, setCenterId] = useState(editing?.centerId ?? '')
  const [memo, setMemo] = useState(editing?.memo ?? '')
  const [repeat, setRepeat] = useState<Repeat>(noRepeat)
  const [error, setError] = useState('')

  if (id && !editing) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-sm font-bold text-ink">일정을 찾을 수 없어요</p>
        <Link to="/calendar" className="focus-ring mt-4 inline-block text-sm font-semibold text-green underline">
          내 일정으로 돌아가기
        </Link>
      </div>
    )
  }

  const pageTitle = editing ? '일정 수정' : '일정 등록'
  const originalDate = editing?.date ?? params.get('date') ?? ''

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!title || !date || !start || !end) return setError('제목, 날짜, 시간을 모두 입력해주세요')
    if (start >= end) return setError('종료 시간은 시작 시간보다 늦어야 해요')
    const data = { title, date, start, end, centerId, memo }
    if (editing) updateSchedule(editing.id, data)
    else if (repeat.on) {
      const dates = repeatDates(date, repeat)
      if (typeof dates === 'string') return setError(dates)
      addRepeating({ title, start, end, centerId, memo }, dates)
    } else addSchedule(data)
    navigate(`/calendar?date=${date}`)
  }

  return (
    <div>
      <PageHero title={pageTitle} breadcrumb={[{ label: '내 일정', to: '/calendar' }, { label: pageTitle }]} />
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Card>
          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
            <label className="text-sm font-semibold text-ink">
              제목
              <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
            </label>
            <label className="text-sm font-semibold text-ink">
              날짜
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm font-semibold text-ink">
                시작 시간
                <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className={inputClass} />
              </label>
              <label className="text-sm font-semibold text-ink">
                종료 시간
                <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className={inputClass} />
              </label>
            </div>
            {!editing && <RepeatFields date={date} value={repeat} onChange={setRepeat} />}
            <label className="text-sm font-semibold text-ink">
              돌봄 센터 (선택)
              <select value={centerId} onChange={(e) => setCenterId(e.target.value)} className={inputClass}>
                <option value="">선택 안 함</option>
                {centers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold text-ink">
              메모 (선택)
              <textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={3} className={inputClass} />
            </label>
            {error && <p className="text-sm text-error">{error}</p>}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => navigate(`/calendar?date=${originalDate}`)} className="flex-1">
                취소
              </Button>
              <Button type="submit" className="flex-1">
                {editing ? '저장' : '등록'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
