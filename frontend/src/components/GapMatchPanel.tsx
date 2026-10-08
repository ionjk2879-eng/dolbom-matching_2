import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from './Card'
import { distanceKm, formatDistance, type LatLng } from '../data/geo'
import { overlapWithGap, remainingGap, toMinutes, type Gap } from '../data/gaps'
import { careTypeLabels } from '../data/careMatch'
import { WEEKDAY_LABELS } from '../data/date'
import type { CareOption, Child } from '../data/types'
import { useCareScheduleStore } from '../store/careScheduleStore'
import { usePaged } from '../hooks/usePaged'

export function GapMatchPanel({
  child,
  gap,
  options,
  className = '',
}: {
  child: Child
  gap: Gap
  options: CareOption[]
  className?: string
}) {
  const { schedules, addSchedule, removeSchedule, updateSchedule } = useCareScheduleStore()
  const [sortBy, setSortBy] = useState<'coverage' | 'distance'>('coverage')
  const [here, setHere] = useState<LatLng | null>(null)
  const [locationError, setLocationError] = useState('')
  const [pending, setPending] = useState<string[]>([])
  const [selectingOption, setSelectingOption] = useState<{
    option: CareOption
    overlap: Gap
    days: number[]      // 선택 가능한 전체 요일 (일~토 정렬)
    takenDays: number[] // 다른 돌봄 센터가 이미 선택한 요일
    selected: number[]  // 사용자가 고른 요일
    existingId?: string // 수정 모드: 기존 일정 ID
  } | null>(null)

  const sortByDistance = () => {
    setSortBy('distance')
    if (here) return
    setLocationError('')
    if (!navigator.geolocation) return setLocationError('이 브라우저는 위치 확인을 지원하지 않아요')
    navigator.geolocation.getCurrentPosition(
      (pos) => setHere({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocationError('위치 권한이 없어서 거리를 계산할 수 없어요'),
    )
  }

  // 방문형 돌봄 등 좌표가 없는 곳은 거리 계산 불가 -> 가까운순에서 맨 뒤
  const distanceOf = (o: CareOption) =>
    here && o.latitude != null && o.longitude != null
      ? distanceKm(here, { lat: o.latitude, lng: o.longitude })
      : null

  const candidates = options
    .map((option) => ({ option, overlap: overlapWithGap(option, gap), distance: distanceOf(option) }))
    .filter((c): c is { option: CareOption; overlap: Gap; distance: number | null } => c.overlap !== null)
    .sort((a, b) => {
      if (sortBy === 'distance' && here) return (a.distance ?? Infinity) - (b.distance ?? Infinity)
      const dur = (o: Gap) => toMinutes(o.end) - toMinutes(o.start)
      return dur(b.overlap) - dur(a.overlap)
    })

  // Only a pick whose time falls inside this gap counts as checked here (one option can serve several gaps)
  const checkedFor = (optionId: string) => {
    const mine = schedules.filter((s) => s.childId === child.id && s.type === 'care')
    const tagged = mine.find(
      (s) =>
        s.careOptionId === optionId &&
        toMinutes(s.startTime) < toMinutes(gap.end) &&
        toMinutes(s.endTime) > toMinutes(gap.start),
    )
    if (tagged) return tagged
    // careOptionId lives in localStorage, so on another device a pick has no tag. Recognize it by its
    // exact time (it was saved as this option's overlap) so the box shows checked instead of inviting a duplicate.
    // ponytail: two options with the identical overlap both read as checked; fixed once the tag is stored server-side
    const overlap = candidates.find((c) => c.option.id === optionId)?.overlap
    return overlap && mine.find((s) => !s.careOptionId && s.startTime === overlap.start && s.endTime === overlap.end)
  }

  // Show a few at a time (options is rebuilt each render, so reset on what actually changes);
  // checked options stay visible even past the cut
  const paged = usePaged(candidates, 5, `${sortBy}-${here ? 'here' : ''}-${options.length}`)
  const shown = candidates.filter((c, i) => i < paged.count || checkedFor(c.option.id))

  const checkedOverlaps = candidates
    .filter((c) => checkedFor(c.option.id))
    .map((c) => c.overlap)
  const remaining = remainingGap(gap, checkedOverlaps)
  const gapStart = toMinutes(gap.start)
  const gapLength = toMinutes(gap.end) - gapStart
  const toPercent = (t: string) => ((toMinutes(t) - gapStart) / gapLength) * 100

  const computeDays = (): number[] => {
    const schoolDays = [...new Set(
      schedules
        .filter((s) => s.childId === child.id && s.type === 'child_school')
        .flatMap((s) => s.daysOfWeek)
    )]
    const parentWork = schedules.filter((s) => s.childId === null && s.type === 'parent_work')
    const daysOf = (label: 'mom' | 'dad') => parentWork.filter((s) => s.parentLabel === label).flatMap((s) => s.daysOfWeek)
    const [momDays, dadDays] = [daysOf('mom'), daysOf('dad')]
    const untaggedDays = parentWork.filter((s) => !s.parentLabel).flatMap((s) => s.daysOfWeek)
    const workDays =
      momDays.length && dadDays.length
        ? [...new Set([...momDays.filter((d) => dadDays.includes(d)), ...untaggedDays])]
        : [...new Set(parentWork.flatMap((s) => s.daysOfWeek))]
    const days = schoolDays.length > 0 ? schoolDays.filter((d) => workDays.includes(d)) : workDays
    // eslint-disable-next-line react/purity
    const result = days.length > 0 ? days : [new Date().getDay()]
    return [...new Set(result)].sort((a, b) => a - b)
  }

  const takenDaysFor = (overlap: Gap, excludeId?: string) =>
    [...new Set(
      schedules
        .filter((s) =>
          s.childId === child.id &&
          s.type === 'care' &&
          s.id !== excludeId &&
          toMinutes(s.startTime) < toMinutes(overlap.end) &&
          toMinutes(s.endTime) > toMinutes(overlap.start),
        )
        .flatMap((s) => s.daysOfWeek),
    )].sort((a, b) => a - b)

  const toggle = (option: CareOption, overlap: Gap) => {
    if (pending.includes(option.id)) return
    // 이미 피커가 열려 있으면 닫기
    if (selectingOption?.option.id === option.id) {
      setSelectingOption(null)
      return
    }
    const allDays = computeDays()
    const existing = checkedFor(option.id)
    if (existing) {
      // 수정 모드: 기존 요일 선택 상태로 피커 열기 (자신 제외)
      const takenDays = takenDaysFor(overlap, existing.id)
      setSelectingOption({ option, overlap, days: allDays, takenDays, selected: [...existing.daysOfWeek], existingId: existing.id })
      return
    }
    // 신규: 남은 요일 우선 선택
    const takenDays = takenDaysFor(overlap)
    const remaining = allDays.filter((d) => !takenDays.includes(d))
    const initialSelected = remaining.length > 0 ? remaining : [...allDays]
    setSelectingOption({ option, overlap, days: allDays, takenDays, selected: initialSelected })
  }

  const confirmDayPick = async () => {
    if (!selectingOption || selectingOption.selected.length === 0) return
    const { option, overlap, selected, existingId } = selectingOption
    const days = [...selected].sort((a, b) => a - b)
    setPending((p) => [...p, option.id])
    const payload = {
      type: 'care' as const,
      childId: child.id,
      careOptionId: option.id,
      title: option.name,
      daysOfWeek: days,
      startTime: overlap.start,
      endTime: overlap.end,
    }
    const ok = existingId
      ? await updateSchedule(existingId, payload)
      : await addSchedule(payload)
    setPending((p) => p.filter((id) => id !== option.id))
    if (ok) setSelectingOption(null)
  }

  const deleteExisting = async (optionId: string) => {
    const existing = checkedFor(optionId)
    if (!existing) return
    setPending((p) => [...p, optionId])
    await removeSchedule(existing.id)
    setPending((p) => p.filter((id) => id !== optionId))
    setSelectingOption(null)
  }

  const toggleDay = (d: number) =>
    setSelectingOption((prev) =>
      prev
        ? {
            ...prev,
            selected: prev.selected.includes(d)
              ? prev.selected.filter((x) => x !== d)
              : [...prev.selected, d],
          }
        : null,
    )

  return (
    <Card className={className}>
      <p className="text-sm text-ink">
        <span className="font-bold">{child.name}</span>의 오늘 돌봄 공백{' '}
        <span className="rounded-lg bg-warn-bg px-2 py-1 font-bold text-warn">
          {gap.start}~{gap.end}
        </span>
        에 맞는 돌봄 옵션이에요. 체크해서 조합해보세요.
      </p>

      <div
        className="relative mt-4 h-3 overflow-hidden rounded-full bg-warn-bg"
        role="img"
        aria-label={remaining.length === 0 ? '공백이 모두 커버됨' : '공백 커버 현황'}
      >
        {checkedOverlaps.map((o) => (
          <div
            key={`${o.start}-${o.end}`}
            className="absolute inset-y-0 bg-green"
            style={{ left: `${toPercent(o.start)}%`, width: `${toPercent(o.end) - toPercent(o.start)}%` }}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-xs text-ink-2">
        <span>{gap.start}</span>
        <span>{gap.end}</span>
      </div>

      <p className="mt-2 text-xs font-semibold">
        {remaining.length === 0 ? (
          <span className="text-green">공백이 모두 커버됐어요</span>
        ) : (
          <span className="text-ink-2">
            아직 안 채워진 시간: {remaining.map((r) => `${r.start}~${r.end}`).join(', ')}
          </span>
        )}
      </p>

      {candidates.length > 1 && (
        <div className="mt-4 flex items-center gap-1 text-xs font-semibold" role="group" aria-label="정렬">
          {(
            [
              ['coverage', '공백 커버순', () => setSortBy('coverage')],
              ['distance', '가까운순', sortByDistance],
            ] as const
          ).map(([key, label, onClick]) => (
            <button
              key={key}
              type="button"
              aria-pressed={sortBy === key}
              onClick={onClick}
              className={`focus-ring tap-target rounded-full border px-3 py-1 transition ${
                sortBy === key ? 'border-green bg-green-soft text-green' : 'border-line-2 text-ink-2 hover:border-green/50'
              }`}
            >
              {label}
            </button>
          ))}
          {sortBy === 'distance' && !here && !locationError && <span className="ml-1 text-ink-2">위치 확인 중...</span>}
          {locationError && <span className="ml-1 text-error">{locationError}</span>}
        </div>
      )}

      {candidates.length === 0 && (
        <p className="mt-3 text-sm text-ink-2">이 공백에 맞는 돌봄 옵션을 찾지 못했어요</p>
      )}

      <div className="mt-3 flex flex-col gap-2">
        {shown.map(({ option, overlap, distance }) => {
          const checked = Boolean(checkedFor(option.id))
          const isSelecting = selectingOption?.option.id === option.id
          return (
            <div
              key={option.id}
              className={`overflow-hidden rounded-xl border transition ${
                checked || isSelecting ? 'border-green' : 'border-line'
              }`}
            >
              <label
                className={`flex cursor-pointer items-start gap-3 p-3 transition ${
                  checked || isSelecting ? 'bg-green-soft/40' : 'bg-ivory-card hover:bg-green-soft/10'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked || isSelecting}
                  disabled={pending.includes(option.id)}
                  onChange={() => toggle(option, overlap)}
                  className="mt-1 h-4 w-4 accent-green"
                />
                <div>
                  <p className="text-sm font-bold text-ink">
                    <Link
                      to={`/find/${option.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="hover:underline"
                    >
                      {option.name}
                    </Link>{' '}
                    <span className="font-normal text-ink-2">· {careTypeLabels[option.type]}</span>
                  </p>
                  <p className="mt-1 text-xs text-ink-2">
                    운영 {option.open_time}~{option.close_time} · 공백 커버{' '}
                    <span className="font-semibold text-green">
                      {overlap.start}~{overlap.end}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-ink-2">{option.address}</p>
                  <p className="mt-0.5 text-xs text-ink-2">
                    시간당 {option.cost_per_hour === 0 ? '무료' : `${option.cost_per_hour.toLocaleString()}원`}
                    {distance != null && ` · ${formatDistance(distance)}`}
                  </p>
                </div>
              </label>

              {isSelecting && (
                <div className="border-t border-green/30 bg-green-soft/20 px-3 py-3 flex flex-col gap-2">
                  <p className="text-xs font-semibold text-ink-2">적용할 요일 선택</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectingOption.days.map((d) => {
                      const sel = selectingOption.selected.includes(d)
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => toggleDay(d)}
                          className={`h-8 w-8 rounded-full text-xs font-semibold transition ${
                            sel
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
                      onClick={confirmDayPick}
                      disabled={selectingOption.selected.length === 0 || pending.includes(option.id)}
                      className="focus-ring rounded-lg bg-green px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                    >
                      {pending.includes(option.id) ? '저장 중...' : '적용'}
                    </button>
                    {selectingOption.existingId && (
                      <button
                        type="button"
                        onClick={() => deleteExisting(option.id)}
                        disabled={pending.includes(option.id)}
                        className="focus-ring rounded-lg border border-error/40 px-4 py-1.5 text-xs font-semibold text-error disabled:opacity-40"
                      >
                        삭제
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectingOption(null)}
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
      {paged.hasMore && (
        <button
          type="button"
          onClick={paged.showMore}
          className="focus-ring mt-2 min-h-11 w-full rounded-xl border border-line-2 text-sm font-semibold text-ink-2 hover:text-ink"
        >
          더 보기 ({Math.min(paged.count, candidates.length)}/{candidates.length})
        </button>
      )}
    </Card>
  )
}
