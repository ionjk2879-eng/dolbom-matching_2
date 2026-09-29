import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHero } from '../components/PageHero'
import { Chip } from '../components/Chip'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { useHashTab } from '../hooks/useHashTab'
import { centers } from '../data/centers'
import { gradesOverlap } from '../data/grade'
import { coversTime } from '../data/time'
import { toISO } from '../data/date'
import { useRequestStore } from '../store/requestStore'

const TABS = ['new', 'offers', 'manage']
const gradeOptions = ['유아', '초1~2', '초3~4', '초5~6']
const areaOptions = ['유성구', '동구', '중구', '서구', '대덕구']
const dayOptions = ['월', '화', '수', '목', '금']
const timeOptions = ['~오후5시', '~오후7시', '오후7시 이후']
const needOptions = ['차량 운행', '무료·저비용', '평점 높은 곳', '빈자리 있음']

function toggle<T>(list: T[], v: T): T[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v]
}

export function RequestPage() {
  const [tab, setTab] = useHashTab(TABS, 'new')

  // #new
  const [grade, setGrade] = useState('')
  const [areas, setAreas] = useState<string[]>([])
  const [days, setDays] = useState<string[]>([])
  const [pickupTime, setPickupTime] = useState('')
  const [needs, setNeeds] = useState<string[]>([])
  const [memo, setMemo] = useState('')
  const [submitted, setSubmitted] = useState(false)

  // #offers, #manage
  const { offers, requests, addRequest, respondOffer, toggleRequestStatus } = useRequestStore()

  const matchedCount = centers.filter(
    (c) =>
      (!grade || gradesOverlap(c.grade, grade)) &&
      (areas.length === 0 || areas.includes(c.district)) &&
      days.every((d) => c.days.includes(d)) &&
      coversTime(c.hours, pickupTime),
  ).length

  const submitRequest = () => {
    addRequest({
      grade,
      areas,
      days,
      pickupTime,
      needs,
      memo,
      createdAt: toISO(new Date()),
      offerCount: 0,
      status: 'open',
    })
    setSubmitted(true)
  }

  return (
    <div>
      <PageHero
        title="돌봄 요청"
        desc="필요한 조건을 등록하면 센터가 먼저 제안을 보내드려요"
        tabs={[
          { key: 'new', label: '요청 등록' },
          { key: 'offers', label: '받은 제안' },
          { key: 'manage', label: '요청 관리' },
        ]}
        activeTab={tab}
        onTabChange={setTab}
      />

      <div className="mx-auto max-w-6xl px-4 py-10">
        {tab === 'new' &&
          (submitted ? (
            <Card className="mx-auto max-w-md text-center">
              <p className="text-lg font-bold text-ink">돌봄 요청이 전달되었어요</p>
              <p className="mt-2 text-sm text-ink-2">조건에 맞는 센터가 확인 후 제안을 보내드릴게요.</p>
              <button
                onClick={() => setTab('offers')}
                className="focus-ring mt-4 text-sm font-semibold text-green underline"
              >
                받은 제안 보러 가기
              </button>
            </Card>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
              <Card className="flex flex-col gap-6">
                <div>
                  <p className="text-sm font-bold text-ink">아이 학년</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {gradeOptions.map((g) => (
                      <Chip key={g} selected={grade === g} onClick={() => setGrade(g)}>
                        {g}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-ink">희망 지역</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {areaOptions.map((a) => (
                      <Chip key={a} selected={areas.includes(a)} onClick={() => setAreas(toggle(areas, a))}>
                        {a}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-ink">요일</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {dayOptions.map((d) => (
                      <Chip key={d} selected={days.includes(d)} onClick={() => setDays(toggle(days, d))}>
                        {d}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-ink">하원 시간</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {timeOptions.map((t) => (
                      <Chip key={t} selected={pickupTime === t} onClick={() => setPickupTime(t)}>
                        {t}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-ink">필요한 것</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {needOptions.map((n) => (
                      <Chip key={n} selected={needs.includes(n)} onClick={() => setNeeds(toggle(needs, n))}>
                        {n}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div>
                  <label htmlFor="memo" className="text-sm font-bold text-ink">
                    메모
                  </label>
                  <textarea
                    id="memo"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    rows={4}
                    className="focus-ring mt-2 w-full rounded-xl border border-line-2 bg-ivory-card p-3 text-sm"
                    placeholder="센터에 전달하고 싶은 내용을 적어주세요"
                  />
                </div>
              </Card>

              <div className="h-fit lg:sticky lg:top-6">
                <div className="rounded-[20px] bg-ink p-5 text-white">
                  <p className="text-sm font-bold">요청 요약</p>
                  <ul className="mt-3 space-y-1 text-sm text-white/80">
                    <li>학년: {grade || '미선택'}</li>
                    <li>지역: {areas.join(', ') || '미선택'}</li>
                    <li>요일: {days.join(', ') || '미선택'}</li>
                    <li>하원 시간: {pickupTime || '미선택'}</li>
                    <li>필요한 것: {needs.join(', ') || '미선택'}</li>
                  </ul>
                  <p className="mt-4 text-sm font-bold text-sand">조건에 맞는 센터 {matchedCount}곳에 전달</p>
                  <Button onClick={submitRequest} className="mt-4 w-full">
                    돌봄 요청 보내기
                  </Button>
                </div>
              </div>
            </div>
          ))}

        {tab === 'offers' && (
          <div className="flex flex-col gap-4">
            {offers.map((o) => {
              const center = centers.find((c) => c.id === o.centerId)
              return (
                <Card key={o.id} className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-ink">{center?.name}</p>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          o.status === 'accepted'
                            ? 'bg-green-soft text-green'
                            : o.status === 'declined'
                              ? 'bg-line-3 text-ink-2'
                              : 'bg-warn-bg text-warn'
                        }`}
                      >
                        {o.status === 'accepted' ? '수락됨' : o.status === 'declined' ? '거절됨' : '대기 중'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-ink-3">
                      {center?.area} · ★{center?.rating}
                    </p>
                    <p className="mt-2 text-sm text-ink-2">"{o.message}"</p>
                    <p className="mt-2 text-xs text-ink-3">
                      시작일 {o.start} · {o.time} · {o.fee === 0 ? '무료' : `월 ${o.fee.toLocaleString()}원`} ·{' '}
                      {o.bus ? '차량 운행' : '차량 없음'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {o.status === 'pending' ? (
                      <>
                        <Button variant="outline" onClick={() => respondOffer(o.id, 'declined')}>
                          거절
                        </Button>
                        <Button onClick={() => respondOffer(o.id, 'accepted')}>수락하고 상담</Button>
                      </>
                    ) : (
                      <Button variant="outline" onClick={() => respondOffer(o.id, 'pending')}>
                        되돌리기
                      </Button>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {tab === 'manage' && (
          <div className="overflow-x-auto rounded-2xl border border-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-ivory-deep text-ink-2">
                <tr>
                  <th className="px-4 py-3 font-semibold">요청 내용</th>
                  <th className="px-4 py-3 font-semibold">등록일</th>
                  <th className="px-4 py-3 font-semibold">받은 제안 수</th>
                  <th className="px-4 py-3 font-semibold">상태</th>
                  <th className="px-4 py-3 font-semibold" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line bg-ivory-card">
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3">
                      {r.grade || '학년 미지정'} · {r.areas.join(', ') || '지역 미지정'}
                    </td>
                    <td className="px-4 py-3 text-ink-3">{r.createdAt}</td>
                    <td className="px-4 py-3">{r.offerCount}건</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          r.status === 'open' ? 'bg-green-soft text-green' : 'bg-line-3 text-ink-2'
                        }`}
                      >
                        {r.status === 'open' ? '진행 중' : '마감'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="outline" onClick={() => toggleRequestStatus(r.id)}>
                        {r.status === 'open' ? '마감하기' : '다시 열기'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {requests.length === 0 && (
              <p className="p-8 text-center text-sm text-ink-3">
                등록한 요청이 없어요.{' '}
                <Link to="/request#new" className="text-green underline">
                  요청 등록하기
                </Link>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
