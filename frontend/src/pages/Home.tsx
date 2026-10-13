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
import { useAutoRegion } from '../hooks/useAutoRegion'
import { fetchCareOptions, fetchCareOptionsForGap, fetchCareOption } from '../api/careOptions'
import { matchesCareOption, gradeBuckets as grades, timeBuckets as times, REGIONS, careTypeLabels } from '../data/careMatch'
import { DISTRICTS } from '../data/districts'
import type { CareOption, Child } from '../data/types'
import { toISO, WEEKDAY_LABELS } from '../data/date'
import { computeGaps, toMinutes, overlapWithGap, type Gap } from '../data/gaps'
import { useFavoritesStore } from '../store/favoritesStore'
import { HeartButton } from '../components/HeartButton'

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
  const favorites = useFavoritesStore()
  const user = useAuthStore((s) => s.user)
  const { children, schedules, exceptions, addSchedule, updateSchedule, removeSchedule } = useCareScheduleStore()
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
  useAutoRegion(careOptions)

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

  // 즐겨찾기 상세 정보: careOptions에 없는 항목은 개별 fetch로 보완
  const [favDetails, setFavDetails] = useState<Map<string, CareOption>>(new Map())
  useEffect(() => {
    const missing = favorites.ids.filter((fid) => !careOptions.find((o) => o.id === fid))
    if (missing.length === 0) return
    Promise.all(missing.map(fetchCareOption)).then((opts) => {
      setFavDetails((prev) => {
        const next = new Map(prev)
        opts.forEach((o) => { if (o) next.set(o.id, o) })
        return next
      })
    })
  }, [favorites.ids, careOptions])

  const getOpt = (fid: string) => careOptions.find((o) => o.id === fid) ?? favDetails.get(fid)

  // 즐겨찾기 → 공백 등록 상태
  const [selectingFav, setSelectingFav] = useState<{
    fid: string
    childId: string
    overlap: Gap
    days: number[]
    takenDays: number[]
    selected: number[]
    existingId?: string
  } | null>(null)
  const [favPending, setFavPending] = useState<string[]>([])

  const repeating = schedules.filter((s) => !s.date)

  // 즐겨찾기 센터가 각 아이의 공백을 커버하는 경우 목록
  const favCoverage = (opt: CareOption) =>
    childGaps.flatMap(({ child, gaps }) =>
      gaps.flatMap((gap) => {
        const overlap = overlapWithGap(opt, gap)
        return overlap ? [{ child, gap, overlap }] : []
      })
    )

  // 이미 care 일정에 등록된 경우
  const favExisting = (fid: string, childId: string) =>
    repeating.find((s) => s.type === 'care' && s.careOptionId === fid && s.childId === childId)

  // 해당 아이의 공백 등록 가능 요일 계산 (GapMatchPanel의 computeDays와 동일 로직)
  const computeDaysForChild = (childId: string) => {
    const schoolDays = [...new Set(repeating.filter((s) => s.childId === childId && s.type === 'child_school').flatMap((s) => s.daysOfWeek))]
    const parentWork = repeating.filter((s) => s.childId === null && s.type === 'parent_work')
    const daysOf = (label: 'mom' | 'dad') => parentWork.filter((s) => s.parentLabel === label).flatMap((s) => s.daysOfWeek)
    const [momDays, dadDays] = [daysOf('mom'), daysOf('dad')]
    const untagged = parentWork.filter((s) => !s.parentLabel).flatMap((s) => s.daysOfWeek)
    const workDays = momDays.length && dadDays.length
      ? [...new Set([...momDays.filter((d) => dadDays.includes(d)), ...untagged])]
      : [...new Set(parentWork.flatMap((s) => s.daysOfWeek))]
    const days = schoolDays.length > 0 ? schoolDays.filter((d) => workDays.includes(d)) : workDays
    return [...new Set(days.length > 0 ? days : [new Date().getDay()])].sort((a, b) => a - b)
  }

  const takenDaysForFav = (childId: string, overlap: Gap, excludeId?: string) =>
    [...new Set(repeating.filter((s) =>
      s.childId === childId && s.type === 'care' && s.id !== excludeId &&
      toMinutes(s.startTime) < toMinutes(overlap.end) && toMinutes(s.endTime) > toMinutes(overlap.start)
    ).flatMap((s) => s.daysOfWeek))].sort((a, b) => a - b)

  const openFavPicker = (fid: string, opt: CareOption, child: Child, overlap: Gap) => {
    if (favPending.includes(fid)) return
    if (selectingFav?.fid === fid && selectingFav.childId === child.id) { setSelectingFav(null); return }
    const existing = favExisting(fid, child.id)
    const allDays = computeDaysForChild(child.id)
    if (existing) {
      const takenDays = takenDaysForFav(child.id, overlap, existing.id)
      setSelectingFav({ fid, childId: child.id, overlap, days: allDays, takenDays, selected: [...existing.daysOfWeek], existingId: existing.id })
    } else {
      const takenDays = takenDaysForFav(child.id, overlap)
      const rem = allDays.filter((d) => !takenDays.includes(d))
      setSelectingFav({ fid, childId: child.id, overlap, days: allDays, takenDays, selected: rem.length > 0 ? rem : [...allDays] })
    }
  }

  const confirmFavPick = async () => {
    if (!selectingFav || selectingFav.selected.length === 0) return
    const opt = getOpt(selectingFav.fid)
    if (!opt) return
    const { fid, childId, overlap, selected, existingId } = selectingFav
    setFavPending((p) => [...p, fid])
    const payload = { type: 'care' as const, childId, careOptionId: fid, title: opt.name, daysOfWeek: [...selected].sort((a, b) => a - b), startTime: overlap.start, endTime: overlap.end }
    const ok = existingId ? await updateSchedule(existingId, payload) : await addSchedule(payload)
    setFavPending((p) => p.filter((id) => id !== fid))
    if (ok) setSelectingFav(null)
  }

  const deleteFavCare = async (fid: string, childId: string) => {
    const existing = favExisting(fid, childId)
    if (!existing) return
    setFavPending((p) => [...p, fid])
    await removeSchedule(existing.id)
    setFavPending((p) => p.filter((id) => id !== fid))
    setSelectingFav(null)
  }

  const goMatch = () => navigate('/find')

  const locationFilteredOptions = careOptions.filter((c) =>
    matchesCareOption(c, '', '', match.region, match.district, match.costFilter)
  )
  const matchedCount = locationFilteredOptions.filter((c) =>
    matchesCareOption(c, match.grade, match.time)
  ).length

  return (
    <div>
      <title>After School</title>
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
        <div className="grid gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          {/* 왼쪽: 캘린더 */}
          <div>
            <h2 className="text-xl font-extrabold text-ink"><span className="mr-1.5 text-green">1</span>반복 일정 등록</h2>
            <p className="mt-1 text-sm text-ink-2">부모 근무·아이 학교 시간을 캘린더에 등록하면 돌봄 공백을 자동 계산해요</p>
            {user ? (
              <Card className="mt-5">
                <CareScheduleEditor careOptions={careOptions} />
              </Card>
            ) : (
              <Card className="mt-5 flex flex-col items-center gap-3 py-8 text-center">
                <p className="text-sm text-ink-2">로그인하면 반복 일정을 등록하고 돌봄 공백을 계산할 수 있어요</p>
                <Link
                  to="/login"
                  className="focus-ring tap-link rounded-xl bg-green px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
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
            </div>

            {favorites.ids.length > 0 && (
              <div className="mt-5 flex flex-col gap-2">
                <p className="text-xs font-semibold text-ink-2">즐겨찾기</p>
                {favorites.ids.map((fid) => {
                  const opt = getOpt(fid)
                  const coverages = opt ? favCoverage(opt) : []
                  const isSelecting = selectingFav?.fid === fid
                  return (
                    <div key={fid} className={`overflow-hidden rounded-xl border transition ${isSelecting ? 'border-green' : 'border-line'}`}>
                      <div className={`p-3 ${isSelecting ? 'bg-green-soft/30' : 'bg-ivory-card'}`}>
                        <div className="flex items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-baseline gap-x-1">
                              <Link to={`/find/${fid}`} className="focus-ring text-sm font-bold text-ink hover:underline">
                                {opt?.name ?? '로딩 중...'}
                              </Link>
                              {opt && <span className="text-xs text-ink-2">· {careTypeLabels[opt.type]}</span>}
                            </div>
                            {opt && (
                              <>
                                <p className="mt-0.5 text-xs text-ink-2">
                                  운영 {opt.open_time}~{opt.close_time}
                                  {' · '}
                                  {opt.cost_per_hour === 0 ? '무료' : `시간당 ${opt.cost_per_hour.toLocaleString()}원`}
                                </p>
                                <p className="mt-0.5 truncate text-xs text-ink-2">{opt.address}</p>
                              </>
                            )}
                          </div>
                          <HeartButton active={true} onToggle={() => favorites.toggle(fid)} className="shrink-0" />
                        </div>

                        {/* 공백에 등록 버튼 — 로그인 + gap 커버 가능한 경우만 */}
                        {user && opt && coverages.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {coverages.map(({ child, overlap }) => {
                              const existing = favExisting(fid, child.id)
                              const thisSel = isSelecting && selectingFav?.childId === child.id
                              return (
                                <button
                                  key={child.id}
                                  type="button"
                                  disabled={favPending.includes(fid)}
                                  onClick={() => openFavPicker(fid, opt, child, overlap)}
                                  className={`focus-ring tap-target rounded-lg border px-3 py-1 text-xs font-semibold transition ${
                                    thisSel
                                      ? 'border-green bg-green text-white'
                                      : existing
                                      ? 'border-green text-green hover:bg-green-soft'
                                      : 'border-line-2 text-ink-2 hover:border-green/50 hover:text-green'
                                  }`}
                                >
                                  {coverages.length > 1 ? `${child.name} ` : ''}{existing ? (thisSel ? '닫기' : '등록 수정') : (thisSel ? '닫기' : '공백에 등록')}
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>

                      {/* 요일 피커 */}
                      {isSelecting && selectingFav && (
                        <div className="flex flex-col gap-2 border-t border-green/30 bg-green-soft/20 px-3 py-3">
                          <p className="text-xs font-semibold text-ink-2">
                            {selectingFav.overlap.start}~{selectingFav.overlap.end} 적용할 요일 선택
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {selectingFav.days.map((d) => {
                              const sel = selectingFav.selected.includes(d)
                              const taken = selectingFav.takenDays.includes(d)
                              return (
                                <button
                                  key={d}
                                  type="button"
                                  disabled={taken}
                                  onClick={() =>
                                    setSelectingFav((prev) =>
                                      prev
                                        ? { ...prev, selected: sel ? prev.selected.filter((x) => x !== d) : [...prev.selected, d] }
                                        : null
                                    )
                                  }
                                  className={`h-8 w-8 rounded-full text-xs font-semibold transition ${
                                    taken
                                      ? 'cursor-not-allowed border border-line-2 text-ink-3 opacity-40'
                                      : sel
                                      ? 'bg-green text-white'
                                      : 'border border-line-2 bg-ivory text-ink-2 hover:border-green/50'
                                  }`}
                                >
                                  {WEEKDAY_LABELS[d]}
                                </button>
                              )
                            })}
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={confirmFavPick}
                              disabled={selectingFav.selected.length === 0 || favPending.includes(fid)}
                              className="focus-ring rounded-lg bg-green px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                            >
                              {favPending.includes(fid) ? '저장 중...' : '적용'}
                            </button>
                            {selectingFav.existingId && (
                              <button
                                type="button"
                                onClick={() => deleteFavCare(fid, selectingFav.childId)}
                                disabled={favPending.includes(fid)}
                                className="focus-ring rounded-lg border border-error/40 px-4 py-1.5 text-xs font-semibold text-error disabled:opacity-40"
                              >
                                삭제
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setSelectingFav(null)}
                              className="focus-ring text-xs font-semibold text-ink-2"
                            >
                              취소
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

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
                {!match.region && (
                  <p className="text-xs text-ink-2">일정 등록의 &lsquo;거주지&rsquo;를 선택하면 우리 동네 돌봄만 보여드려요.</p>
                )}
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
                                  className="focus-ring tap-target ml-2 text-error"
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
                <Button onClick={goMatch} className="min-h-11 w-full">
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
