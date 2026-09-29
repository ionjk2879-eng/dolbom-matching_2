import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PageHero } from '../components/PageHero'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Chip } from '../components/Chip'
import { centers } from '../data/centers'
import { useConsultStore } from '../store/consultStore'
import { useMatchStore } from '../store/matchStore'

const grades = ['유아', '초1~2', '초3~4', '초5~6']
const inputClass = 'focus-ring mt-1.5 w-full rounded-xl border border-line-2 bg-ivory-card px-4 py-2.5 text-sm font-normal'

export function ConsultNew() {
  const { id } = useParams()
  const navigate = useNavigate()
  const center = centers.find((c) => c.id === id)
  const addConsult = useConsultStore((s) => s.addConsult)
  const [grade, setGrade] = useState(() => useMatchStore.getState().grade)
  const [phone, setPhone] = useState('')
  const [date, setDate] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  if (!center) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-sm font-bold text-ink">센터를 찾을 수 없어요</p>
        <Link to="/find" className="focus-ring mt-4 inline-block text-sm font-semibold text-green underline">
          돌봄 찾기로 돌아가기
        </Link>
      </div>
    )
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!grade || !phone || !date) return setError('아이 학년, 연락처, 희망 상담일을 입력해주세요')
    if (!/^01[016789]-?\d{3,4}-?\d{4}$/.test(phone)) return setError('휴대폰 번호 형식이 올바르지 않아요 (예: 010-1234-5678)')
    addConsult({ centerId: center.id, grade, phone, date, message })
    navigate(`/centers/${center.id}`)
  }

  return (
    <div>
      <PageHero
        title="상담 신청"
        desc={center.name}
        breadcrumb={[
          { label: '돌봄 찾기', to: '/find' },
          { label: center.name, to: `/centers/${center.id}` },
          { label: '상담 신청' },
        ]}
      />
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Card>
          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-semibold text-ink">아이 학년</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {grades.map((g) => (
                  <Chip key={g} selected={grade === g} onClick={() => setGrade(g)}>
                    {g}
                  </Chip>
                ))}
              </div>
            </div>
            <label className="text-sm font-semibold text-ink">
              연락처
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010-0000-0000"
                className={inputClass}
              />
            </label>
            <label className="text-sm font-semibold text-ink">
              희망 상담일
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
            </label>
            <label className="text-sm font-semibold text-ink">
              문의 내용 (선택)
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className={inputClass} />
            </label>
            {error && <p className="text-sm text-error">{error}</p>}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => navigate(-1)} className="flex-1">
                취소
              </Button>
              <Button type="submit" className="flex-1">
                신청하기
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
