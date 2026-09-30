import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Chip } from '../components/Chip'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { GapMatchPanel } from '../components/GapMatchPanel'
import { CareScheduleEditor } from '../components/CareScheduleEditor'
import { useMatchStore } from '../store/matchStore'
import { useAuthStore } from '../store/authStore'
import { useCareScheduleStore } from '../store/careScheduleStore'
import { fetchCareOptions, fetchCareOptionsForGap } from '../api/careOptions'
import { matchesCareOption } from '../data/careMatch'
import type { CareOption } from '../data/types'
import { toISO } from '../data/date'
import { computeGaps } from '../data/gaps'

const grades = ['유아', '초1~2', '초3~4', '초5~6']
const times = ['~오후5시', '~오후7시', '오후7시 이후']
const partners = ['대전광역시', '유성구청', '동구청', '중구청', '서구청', '대덕구청', '육아종합지원센터']

// 아이 학년(1~6) -> 맞춤 매칭 학년 구간, 공백 종료시각 -> 필요한 시간 구간으로 변환
function gradeToBucket(grade: number): string {
  if (grade <= 2) return '초1~2'
  if (grade <= 4) return '초3~4'
  return '초5~6'
}

function endTimeToBucket(end: string): string {
  const h = Number(end.slice(0, 2))
  if (h <= 17) return '~오후5시'
  if (h <= 19) return '~오후7시'
  return '오후7시 이후'
}

export function Home() {
  const navigate = useNavigate()
  const match = useMatchStore()
  const user = useAuthStore((s) => s.user)
  const { children, schedules, exceptions } = useCareScheduleStore()
  const [today] = useState(() => toISO(new Date()))
  const [careOptions, setCareOptions] = useState<CareOption[]>([])
  const primaryChild = children[0]
  const todaysGap = primaryChild ? computeGaps(primaryChild, today, schedules, exceptions)[0] : undefined

  useEffect(() => {
    if (primaryChild && todaysGap) {
      fetchCareOptionsForGap(primaryChild.grade, todaysGap)
        .then(setCareOptions)
        .catch(() => setCareOptions([]))
    } else {
      fetchCareOptions()
        .then(setCareOptions)
        .catch(() => setCareOptions([]))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryChild?.id, primaryChild?.grade, todaysGap?.start, todaysGap?.end])

  useEffect(() => {
    if (user) useCareScheduleStore.getState().loadAll()
  }, [user])

  // 등록된 아이/공백이 있으면, 아직 직접 고르지 않은 조건에 한해 기본값으로 채워준다
  useEffect(() => {
    if (!primaryChild || !todaysGap) return
    if (!match.grade) match.setGrade(gradeToBucket(primaryChild.grade))
    if (!match.time) match.setTime(endTimeToBucket(todaysGap.end))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryChild?.id, todaysGap?.end])

  const goMatch = () => navigate('/find')

  const matchedCount = careOptions.filter((c) => matchesCareOption(c, match.grade, match.time)).length

  return (
    <div>
      {/* 히어로 */}
      <section className="bg-ivory-deep">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <h1 className="text-3xl font-extrabold tracking-[-0.03em] text-ink md:text-4xl">
            함께 돌보면, 아이의 오후가 든든해져요
          </h1>
          <p className="mt-3 text-sm text-ink-2">
            아이/근무 일정을 등록하면 돌봄 공백을 자동으로 계산해서 딱 맞는 돌봄 옵션을 추천해드려요
          </p>
        </div>
      </section>

      {/* 반복 일정 등록 + 맞춤 매칭: 캘린더는 왼쪽, 매칭 결과는 오른쪽 */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-8 md:grid-cols-2">
          {/* 왼쪽: 캘린더 */}
          <div>
            <h2 className="text-xl font-extrabold text-ink">반복 일정 등록</h2>
            <p className="mt-1 text-sm text-ink-3">부모 근무·아이 학교 시간을 캘린더에 등록하면 돌봄 공백을 자동 계산해요</p>
            {user ? (
              <Card className="mt-5">
                <CareScheduleEditor />
              </Card>
            ) : (
              <Card className="mt-5 flex flex-col items-center gap-3 py-8 text-center">
                <p className="text-sm text-ink-3">로그인하면 반복 일정을 등록하고 돌봄 공백을 계산할 수 있어요</p>
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
              <h2 className="text-xl font-extrabold text-ink">맞춤 매칭</h2>
              {user && children.length > 0 && (
                <Link to="/gaps" className="focus-ring text-sm font-semibold text-green hover:underline">
                  공백 캘린더 전체 보기
                </Link>
              )}
            </div>

            {user && primaryChild && !todaysGap && (
              <Card className="mt-5">
                <p className="text-sm text-ink-3">오늘은 {primaryChild.name}의 돌봄 공백이 없어요.</p>
              </Card>
            )}

            {user && primaryChild && todaysGap ? (
              <GapMatchPanel child={primaryChild} gap={todaysGap} options={careOptions} className="mt-5" />
            ) : (
              <Card className="mt-5 flex flex-col justify-between gap-6">
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
                  추천 돌봄 옵션 {matchedCount}곳 보기
                </Button>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* 협력기관 */}
      <section className="border-t border-line bg-ivory-deep-2">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-6 px-4 py-6 text-sm text-ink-3">
          {partners.map((p) => (
            <span key={p}>{p}</span>
          ))}
        </div>
      </section>
    </div>
  )
}
