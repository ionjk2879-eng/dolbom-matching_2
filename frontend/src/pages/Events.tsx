import { useMemo, useState } from 'react'
import { PageHero } from '../components/PageHero'
import { Chip } from '../components/Chip'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { useHashTab } from '../hooks/useHashTab'
import { events as allEvents } from '../data/events'
import type { EventItem } from '../data/types'

const TABS = ['month', 'area', 'edu']
const guOptions = ['전체', '동구', '중구', '서구', '유성구', '대덕구']
const ageOptions: ('전체' | EventItem['ageGroup'])[] = ['전체', '유아', '초등', '양육자']

export function Events() {
  const [tab, setTab] = useHashTab(TABS, 'month')
  const [gu, setGu] = useState('전체')
  const [age, setAge] = useState<(typeof ageOptions)[number]>('전체')
  const [applied, setApplied] = useState<string[]>([])

  const toggleApply = (id: string) => setApplied((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const filtered = useMemo(() => {
    let list = allEvents.filter((e) => (gu === '전체' || e.gu === gu) && (age === '전체' || e.ageGroup === age))
    if (tab === 'edu') list = list.filter((e) => e.edu)
    if (tab === 'area') list = [...list].sort((a, b) => a.gu.localeCompare(b.gu))
    else list = [...list].sort((a, b) => a.date.localeCompare(b.date))
    return list
  }, [gu, age, tab])

  return (
    <div>
      <PageHero
        title="문화·행사"
        desc="아이와 함께하는 대전의 문화·행사를 만나보세요"
        tabs={[
          { key: 'month', label: '이달의 행사' },
          { key: 'area', label: '우리 동네 행사' },
          { key: 'edu', label: '교육 행사' },
        ]}
        activeTab={tab}
        onTabChange={setTab}
      />

      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-wrap gap-2">
          {guOptions.map((g) => (
            <Chip key={g} selected={gu === g} onClick={() => setGu(g)}>
              {g}
            </Chip>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {ageOptions.map((a) => (
            <Chip key={a} selected={age === a} onClick={() => setAge(a)}>
              {a}
            </Chip>
          ))}
        </div>

        <div className="mt-6 grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {filtered.map((e) => {
            const isApplied = applied.includes(e.id)
            const status = e.full ? '마감' : isApplied ? '신청 완료' : '접수 중'
            return (
              <Card key={e.id}>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-ivory-deep px-2.5 py-1 text-xs font-semibold text-ink-2">{e.gu}</span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      status === '마감'
                        ? 'bg-line-3 text-ink-2'
                        : status === '신청 완료'
                          ? 'bg-green-soft text-green'
                          : 'bg-warn-bg text-warn'
                    }`}
                  >
                    {status}
                  </span>
                </div>
                <p className="mt-2 text-xs text-ink-3">{e.kind}</p>
                <p className="mt-1 text-sm font-bold text-ink">{e.title}</p>
                <p className="mt-2 text-xs text-ink-2">
                  {e.date} · {e.age}
                </p>
                <p className="mt-1 text-xs text-ink-3">
                  {e.place} · {e.fee}
                </p>
                <Button
                  variant={isApplied ? 'outline' : 'primary'}
                  disabled={e.full}
                  onClick={() => toggleApply(e.id)}
                  className="mt-3 w-full"
                >
                  {isApplied ? '신청 취소' : '신청하기'}
                </Button>
              </Card>
            )
          })}
        </div>
        {filtered.length === 0 && <p className="py-16 text-center text-sm text-ink-3">조건에 맞는 행사가 없어요.</p>}
      </div>
    </div>
  )
}
