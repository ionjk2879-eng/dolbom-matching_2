import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Chip } from '../components/Chip'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { GapMatchPanel } from '../components/GapMatchPanel'
import { DemoNotice } from '../components/DemoNotice'
import { CareScheduleEditor } from '../components/CareScheduleEditor'
import { useMatchStore } from '../store/matchStore'
import { useAuthStore } from '../store/authStore'
import { useCareScheduleStore } from '../store/careScheduleStore'
import { fetchCareOptions, fetchCareOptionsForGap } from '../api/careOptions'
import { matchesCareOption, gradeBuckets as grades, timeBuckets as times, REGIONS } from '../data/careMatch'
import { DISTRICTS } from '../data/districts'
import type { CareOption } from '../data/types'
import { toISO } from '../data/date'
import { computeGaps, toMinutes } from '../data/gaps'

const steps = [
  { title: '반복 일정 등록', desc: '부모 근무·아이 학교 시간을 한 번만' },
  { title: '공백 자동 계산', desc: '돌봄이 필요한 시간을 찾아드려요' },
  { title: '돌봄 조합 선택', desc: '옵션을 체크해 공백을 채워요' },
]

const partners = ['대전광역시', '유성구청', '동구청', '중구청', '서구청', '대덕구청', '육아종합지원센터']

// 아이 학년(1~6) -> 맞춤 매칭 학년 구간, 공백 종료시각 -> 필요한 시간 구간으로 변환
function gradeToBucket(grade: number): string {
  if (grade <= 2) return '초1~2'
  if (grade <= 4) return '초3~4'
  return '초5~6'
}

// Compare full minutes: a gap ending 17:30 needs a place open past 17:00, so it falls in '~오후7시'
function endTimeToBucket(end: string): string {
  const mins = toMinutes(end)
  if (mins <= 17 * 60) return '~오후5시'
  if (mins <= 19 * 60) return '~오후7시'
  return '오후7시 이후'
}

export function Home() {
  const navigate = useNavigate()
  const match = useMatchStore()
  const user = useAuthStore((s) => s.user)
  const { children, schedules, exceptions } = useCareScheduleStore()
  const [today] = useState(() => toISO(new Date()))
  const [careOptions, setCareOptions] = useState<CareOption[]>([])
  // care 스케줄 제외: 체크 시 gaps가 재계산되어 패널이 remount되는 것을 방지
  const schedulesForGaps = schedules.filter((s) => s.type !== 'care')
  const childGaps = children.map((child) => ({
    child,
    gaps: computeGaps(child, today, schedulesForGaps, exceptions),
  }))
  const firstWithGap = childGaps.find((cg) => cg.gaps.length > 0)

  // 아이마다 자기 학년·공백 기준으로 옵션을 찾고, 여러 아이의 결과를 합친다 (중복 제거)
  const gapsKey = childGaps.map(({ child, gaps }) => `${child.id}:${child.grade}:${gaps.map((g) => `${g.start}-${g.end}`).join(',')}`).join('|')
  useEffect(() => {
    const requests = childGaps.flatMap(({ child, gaps }) => gaps.map((g) => fetchCareOptionsForGap(child.grade, g)))
    if (requests.length > 0) {
      Promise.all(requests)
        .then((lists) => setCareOptions([...new Map(lists.flat().map((o) => [o.id, o])).values()]))
        .catch(() => setCareOptions([]))
    } else {
      fetchCareOptions()
        .then(setCareOptions)
        .catch(() => setCareOptions([]))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gapsKey, today])

  useEffect(() => {
    if (user) useCareScheduleStore.getState().loadAll()
  }, [user])

  // 등록된 아이/공백이 있으면, 아직 직접 고르지 않은 조건에 한해 기본값으로 채워준다
  useEffect(() => {
    if (!firstWithGap) return
    if (!match.grade) match.setGrade(gradeToBucket(firstWithGap.child.grade))
    if (!match.time) match.setTime(endTimeToBucket(firstWithGap.gaps[0].end))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstWithGap?.child.id, firstWithGap?.gaps[0]?.end])

  const goMatch = () => navigate('/find')

  const locationFilteredOptions = careOptions.filter((c) =>
    matchesCareOption(c, '', '', match.region, match.district, match.costFilter)
  )
  const matchedCount = locationFilteredOptions.filter((c) =>
    matchesCareOption(c, match.grade, match.time)
  ).length

  return (
    <div>
      {/* 히어로 */}
      <section className="bg-ivory-deep">
        <div className="mx-auto max-w-6xl px-4 py-12 text-center md:py-16">
          <h1 className="text-3xl font-extrabold tracking-[-0.03em] text-ink md:text-4xl">
            함께 돌보면, 아이의 오후가 든든해져요
          </h1>
          <p className="mt-3 text-sm text-ink-2">
            아이/근무 일정을 등록하면 돌봄 공백을 자동으로 계산해서 딱 맞는 돌봄 옵션을 추천해드려요
          </p>
          <ol className="mx-auto mt-8 grid max-w-3xl gap-3 text-left sm:grid-cols-3">
            {steps.map((step, i) => (
              <li key={step.title} className="flex gap-3 rounded-2xl border border-line bg-ivory-card p-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green text-xs font-bold text-white">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-bold text-ink">{step.title}</p>
                  <p className="mt-0.5 text-xs text-ink-2">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 반복 일정 등록 + 맞춤 매칭: 캘린더는 왼쪽, 매칭 결과는 오른쪽 */}
      <section className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          {/* 왼쪽: 캘린더 */}
          <div>
            <h2 className="text-xl font-extrabold text-ink"><span className="mr-1.5 text-green">1</span>반복 일정 등록</h2>
            <p className="mt-1 text-sm text-ink-2">부모 근무·아이 학교 시간을 캘린더에 등록하면 돌봄 공백을 자동 계산해요</p>
            {user ? (
              <Card className="mt-5">
                <CareScheduleEditor />
              </Card>
            ) : (
              <Card className="mt-5 flex flex-col items-center gap-3 py-8 text-center">
                <p className="text-sm text-ink-2">로그인하면 반복 일정을 등록하고 돌봄 공백을 계산할 수 있어요</p>
                <Link
                  to="/login"
                  className="focus-ring rounded-xl bg-green px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                >
                  로그인하기
                </Link>
              </Card>
            )}
          </div>

          {/* 오른쪽: 맞춤 매칭 (돌봄 공백 기반) */}
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-ink"><span className="mr-1.5 text-green">2</span>맞춤 매칭</h2>
              {user && children.length > 0 && (
                <Link to="/gaps" className="focus-ring text-sm font-semibold text-green hover:underline">
                  공백 캘린더 전체 보기
                </Link>
              )}
            </div>

            <DemoNotice options={careOptions} className="mt-5" />

            {user && childGaps.length > 0 ? (
              <div className="mt-5 flex flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                  {(['all', 'free', 'paid'] as const).map((v) => (
                    <Chip key={v} selected={match.costFilter === v} onClick={() => match.setCostFilter(v)}>
                      {v === 'all' ? '전체' : v === 'free' ? '무료' : '유료'}
                    </Chip>
                  ))}
                </div>
                {childGaps.map(({ child, gaps }) => {
                  const selectedCare = schedules.filter(
                    (s) => s.childId === child.id && s.type === 'care'
                  )
                  if (gaps.length > 0) {
                    return gaps.map((gap) => (
                      <GapMatchPanel
                        key={`${child.id}-${gap.start}`}
                        child={child}
                        gap={gap}
                        options={locationFilteredOptions}
                      />
                    ))
                  }
                  return (
                    <Card key={child.id} className="flex flex-col gap-2">
                      <p className="text-sm font-bold text-ink">{child.name}</p>
                      <p className="text-xs text-ink-2">오늘은 돌봄 공백이 없어요.</p>
                      {selectedCare.length > 0 && (
                        <div className="mt-1 flex flex-col gap-1">
                          <p className="text-xs font-semibold text-ink-2">선택한 돌봄</p>
                          {selectedCare.map((s) => {
                            const option = careOptions.find((o) => o.id === s.careOptionId)
                            return (
                              <div key={s.id} className="flex items-center justify-between rounded-lg bg-green-soft px-2 py-1 text-xs">
                                <span className="font-semibold text-green">
                                  {option?.name ?? '돌봄(선택)'} · {s.startTime}~{s.endTime}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => useCareScheduleStore.getState().removeSchedule(s.id)}
                                  className="focus-ring ml-2 text-error"
                                >
                                  취소
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </Card>
                  )
                })}
              </div>
            ) : (
              <Card className="mt-5 flex flex-col justify-between gap-6">
                <div>
                  <p className="text-sm font-bold text-ink">지역</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <select
                      aria-label="시/도"
                      value={match.region}
                      onChange={(e) => match.setRegion(e.target.value)}
                      className="focus-ring min-h-11 rounded-lg border border-line-2 bg-ivory-card px-3 py-2 text-sm"
                    >
                      <option value="">시/도 전체</option>
                      {REGIONS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    {/* Same 구/군 list as /find, so the choice carries over there */}
                    <select
                      aria-label="구/군"
                      value={match.district}
                      onChange={(e) => match.setDistrict(e.target.value)}
                      disabled={!match.region || (DISTRICTS[match.region]?.length ?? 0) === 0}
                      className="focus-ring min-h-11 rounded-lg border border-line-2 bg-ivory-card px-3 py-2 text-sm disabled:opacity-60"
                    >
                      <option value="">{match.region ? '구/군 전체' : '시/도 먼저 선택'}</option>
                      {(DISTRICTS[match.region] ?? []).map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-ink">아이 학년</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {grades.map((g) => (
                      <Chip key={g} selected={match.grade === g} onClick={() => match.setGrade(g)}>
                        {g}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-ink">필요한 시간</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {times.map((t) => (
                      <Chip key={t} selected={match.time === t} onClick={() => match.setTime(t)}>
                        {t}
                      </Chip>
                    ))}
                  </div>
                </div>
                <Button onClick={goMatch} className="w-full">
                  {match.region || match.grade || match.time ? '조건에 맞는 돌봄' : '전체 돌봄 옵션'} {matchedCount}곳 보기
                </Button>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* 협력기관 */}
      <section className="border-t border-line bg-ivory-deep-2">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-6 px-4 py-6 text-sm text-ink-2">
          {partners.map((p) => (
            <span key={p}>{p}</span>
          ))}
        </div>
      </section>
    </div>
  )
}
