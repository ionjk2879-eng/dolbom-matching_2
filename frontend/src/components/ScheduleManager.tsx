import { useEffect, useState, type FormEvent } from 'react'
import { centers } from '../data/centers'
import { WEEKDAY_LABELS, toISO } from '../data/date'
import { fitsSlot } from '../data/match'
import type { Schedule } from '../data/types'
import { useScheduleStore } from '../store/scheduleStore'

type Form = { title: string; start: string; end: string; centerId: string; memo: string }
const blank: Form = { title: '', start: '', end: '', centerId: '', memo: '' }
const toForm = (s: Schedule): Form => ({ title: s.title, start: s.start, end: s.end, centerId: s.centerId, memo: s.memo })

const inputClass =
  'focus-ring rounded-xl border border-line-2 bg-ivory-card px-4 py-2.5 text-sm font-normal text-ink'

const weekdayOf = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return WEEKDAY_LABELS[new Date(y, m - 1, d).getDay()]
}

const centerName = (id: string) => centers.find((c) => c.id === id)?.name

// Modal: pick a date → see that day's schedules → add/edit with center recommendations
export function ScheduleManager({
  startDate,
  startEditId,
  onClose,
}: {
  startDate?: string
  startEditId?: string
  onClose: () => void
}) {
  const { schedules, addSchedule, updateSchedule, removeSchedule } = useScheduleStore()
  const today = toISO(new Date())
  const initialEdit = schedules.find((s) => s.id === startEditId)

  const [view, setView] = useState(() => {
    const [y, m] = (startDate ?? today).split('-').map(Number)
    return new Date(y, m - 1, 1)
  })
  const [picked, setPicked] = useState(startDate ?? '')
  const [editing, setEditing] = useState(initialEdit ? initialEdit.id : '')
  const [confirmId, setConfirmId] = useState('')
  const [form, setForm] = useState<Form>(() => (initialEdit ? toForm(initialEdit) : blank))
  const [error, setError] = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const year = view.getFullYear()
  const month = view.getMonth()
  const startOffset = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const pick = (iso: string) => {
    setPicked(iso)
    setEditing('')
    setConfirmId('')
    setError('')
  }

  const startEdit = (id: string) => {
    const s = schedules.find((x) => x.id === id)
    setForm(s ? toForm(s) : blank)
    setEditing(id)
    setConfirmId('')
    setError('')
  }

  const setField = (k: keyof Form) => (v: string) => setForm((f) => ({ ...f, [k]: v }))

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.start || !form.end) return setError('제목, 날짜, 시간을 모두 입력해주세요')
    if (form.start >= form.end) return setError('종료 시간은 시작 시간보다 늦어야 해요')
    const data = { ...form, date: picked }
    if (editing === 'new') addSchedule(data)
    else updateSchedule(editing, data)
    setEditing('')
    setError('')
  }

  const dayItems = schedules.filter((s) => s.date === picked).sort((a, b) => a.start.localeCompare(b.start))

  const ready = !!picked && !!form.start && !!form.end && form.start < form.end
  const fits = ready ? centers.filter((c) => fitsSlot(c, picked, form.start, form.end)) : []
  const recs = [...fits]
    .sort((a, b) => Number(b.seats > 0) - Number(a.seats > 0) || a.distanceM - b.distanceM)
    .slice(0, 3)

  let pickedLabel = ''
  if (picked) {
    const [y, m, d] = picked.split('-').map(Number)
    pickedLabel = `${y}년 ${m}월 ${d}일 ${weekdayOf(picked)}요일`
  }
  const title = !picked ? '날짜를 골라주세요' : !editing ? '이 날의 일정' : editing === 'new' ? '새 일정 추가' : '일정 수정'

  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-4">
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="일정 관리"
        className="flex max-h-[calc(100vh-32px)] w-full max-w-[460px] flex-col gap-4 overflow-auto rounded-[20px] border border-line bg-ivory-card p-6 shadow-[0_24px_40px_-28px_rgba(60,50,30,.45)]"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-ink-3">일정 관리</p>
            <p className="mt-0.5 text-xl font-extrabold tracking-[-0.02em] text-ink">{title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="focus-ring h-9 w-9 rounded-xl border border-line-2 text-ink-2 hover:bg-ivory-deep"
          >
            ✕
          </button>
        </div>

        {!picked && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setView(new Date(year, month - 1, 1))}
                aria-label="이전 달"
                className="focus-ring h-9 w-9 rounded-xl border border-line-2 text-ink hover:bg-ivory-deep"
              >
                ‹
              </button>
              <span className="text-base font-extrabold text-ink">
                {year}년 {month + 1}월
              </span>
              <button
                type="button"
                onClick={() => setView(new Date(year, month + 1, 1))}
                aria-label="다음 달"
                className="focus-ring h-9 w-9 rounded-xl border border-line-2 text-ink hover:bg-ivory-deep"
              >
                ›
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {WEEKDAY_LABELS.map((w, i) => (
                <span key={w} className={`py-1 text-center text-xs font-semibold ${i === 0 ? 'text-error' : 'text-ink-3'}`}>
                  {w}
                </span>
              ))}
              {Array.from({ length: startOffset }, (_, i) => (
                <span key={`e${i}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const date = new Date(year, month, i + 1)
                const iso = toISO(date)
                const past = iso < today
                const isToday = iso === today
                const has = schedules.some((s) => s.date === iso)
                const color = past ? 'text-ink-3' : isToday ? 'text-white' : date.getDay() === 0 ? 'text-error' : 'text-ink'
                return (
                  <button
                    key={iso}
                    type="button"
                    disabled={past}
                    onClick={() => pick(iso)}
                    className={`focus-ring flex h-11 flex-col items-center justify-center gap-[3px] rounded-xl border text-sm font-bold ${color} ${
                      past ? 'cursor-default opacity-50' : ''
                    } ${isToday ? 'border-green bg-green' : 'border-line-3 bg-ivory'}`}
                  >
                    <span>{i + 1}</span>
                    <span
                      className={`h-1 w-1 rounded-full ${has ? (isToday ? 'bg-white' : 'bg-green') : 'bg-transparent'}`}
                    />
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-ink-3">
              날짜를 누르면 그 날 일정을 보고 추가·수정·삭제할 수 있어요. 점은 등록된 일정이에요.
            </p>
          </div>
        )}

        {picked && (
          <div className="flex items-center justify-between gap-2 rounded-xl bg-green-soft px-3.5 py-2.5 text-green">
            <span className="text-sm font-bold">{pickedLabel}</span>
            <button type="button" onClick={() => pick('')} className="focus-ring text-xs font-semibold underline">
              날짜 바꾸기
            </button>
          </div>
        )}

        {picked && !editing && (
          <div className="flex flex-col gap-2">
            {dayItems.map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-sm font-bold text-ink">{s.title}</span>
                  <span className="text-xs text-ink-3">
                    {s.start}~{s.end} · {centerName(s.centerId) ?? '센터 연결 안 됨'}
                  </span>
                </span>
                {confirmId === s.id ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-error">삭제할까요?</span>
                    <button
                      type="button"
                      onClick={() => setConfirmId('')}
                      className="focus-ring rounded-[10px] border border-line-2 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-ivory-deep"
                    >
                      아니요
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        removeSchedule(s.id)
                        setConfirmId('')
                      }}
                      className="focus-ring rounded-[10px] bg-error px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                    >
                      삭제
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => startEdit(s.id)}
                      className="focus-ring rounded-[10px] border border-line-2 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-ivory-deep"
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmId(s.id)}
                      className="focus-ring rounded-[10px] border border-line-2 px-3 py-1.5 text-xs font-semibold text-error hover:bg-warn-bg"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
            ))}
            {dayItems.length === 0 && <p className="text-sm text-ink-3">이 날은 등록된 일정이 없어요</p>}
            <button
              type="button"
              onClick={() => startEdit('new')}
              className="focus-ring rounded-xl border border-dashed border-green p-3 text-sm font-bold text-green hover:bg-green-soft"
            >
              + 이 날 일정 추가
            </button>
          </div>
        )}

        {picked && editing && (
          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3.5">
            <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">
              제목
              <input
                value={form.title}
                onChange={(e) => setField('title')(e.target.value)}
                placeholder="예: 하교 후 돌봄"
                className={inputClass}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">
                시작 시간
                <input
                  type="time"
                  value={form.start}
                  onChange={(e) => setField('start')(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">
                종료 시간
                <input
                  type="time"
                  value={form.end}
                  onChange={(e) => setField('end')(e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-semibold text-ink">돌봄 센터 (선택)</span>
                {ready && (
                  <span className="text-xs text-ink-3">
                    {weekdayOf(picked)}요일 {form.start}~{form.end} 운영 {fits.length}곳
                  </span>
                )}
              </div>
              {!ready && (
                <p className="text-[13px] text-ink-2 opacity-55">
                  시작·종료 시간을 입력하면 그 시간과 요일에 운영하는 센터를 골라드려요
                </p>
              )}
              {ready && recs.length === 0 && (
                <p className="rounded-xl bg-warn-bg px-3.5 py-3 text-[13px] text-warn">
                  이 시간에 운영하는 센터가 없어요. 시간을 조정해 보세요.
                </p>
              )}
              {recs.map((c, i) => {
                const selected = form.centerId === c.id
                const dist = c.distanceM >= 1000 ? `${(c.distanceM / 1000).toFixed(1)}km` : `${c.distanceM}m`
                const fee = c.feeMonthly ? `월 ${c.feeMonthly / 10000}만원` : '무료'
                const badge = c.seats === 0 ? '대기' : i === 0 ? '추천' : `빈자리 ${c.seats}`
                const badgeClass =
                  c.seats === 0 ? 'bg-ivory-deep text-ink-2b' : i === 0 ? 'bg-green text-white' : 'bg-green-soft text-green'
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setField('centerId')(selected ? '' : c.id)}
                    className={`focus-ring flex w-full items-center gap-3 rounded-xl border p-3 text-left ${
                      selected ? 'border-green bg-green-soft' : 'border-line bg-ivory-card'
                    }`}
                  >
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm font-bold text-ink">{c.name}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${badgeClass}`}>{badge}</span>
                      </span>
                      <span className="text-xs text-ink-3">
                        운영 {c.hours} · {dist} · {fee}
                        {c.bus && ' · 차량 운행'}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 rounded-[10px] px-3 py-1.5 text-xs font-bold ${
                        selected ? 'bg-green text-white' : 'border border-line-2 text-ink-2'
                      }`}
                    >
                      {selected ? '선택됨' : '선택'}
                    </span>
                  </button>
                )
              })}
              {form.centerId && (
                <button
                  type="button"
                  onClick={() => setField('centerId')('')}
                  className="focus-ring self-start text-xs font-semibold text-ink-2 underline"
                >
                  센터 선택 해제{!recs.some((c) => c.id === form.centerId) && ` (${centerName(form.centerId)})`}
                </button>
              )}
            </div>

            <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">
              메모 (선택)
              <textarea
                value={form.memo}
                onChange={(e) => setField('memo')(e.target.value)}
                rows={2}
                className={`${inputClass} resize-y`}
              />
            </label>
            {error && <p className="text-sm text-error">{error}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditing('')
                  setError('')
                }}
                className="focus-ring flex-1 rounded-xl border border-line-2 px-5 py-2.5 text-sm font-semibold text-ink hover:bg-ivory-deep"
              >
                취소
              </button>
              <button
                type="submit"
                className="focus-ring flex-1 rounded-xl bg-green px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
              >
                {editing === 'new' ? '등록' : '저장'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
