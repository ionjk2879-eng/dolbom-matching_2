import { describe, expect, it } from 'vitest'
import { computeGaps, matchPicks, occursOn, overlapWithGap, remainingGap, subtract, toMinutes, toTime } from './gaps'
import type { CareOption, Child, RecurringSchedule, ScheduleException } from './types'

const MON = '2026-10-12'
const TUE = '2026-10-13'

const kid: Child = { id: 'kid', name: '민지', grade: 2, commuteMinutes: 20 }
const noCommute: Child = { ...kid, commuteMinutes: 0 }

let seq = 0
function sch(s: Partial<RecurringSchedule> & Pick<RecurringSchedule, 'type' | 'startTime' | 'endTime'>): RecurringSchedule {
  return { id: `s${++seq}`, childId: null, daysOfWeek: [1, 2, 3, 4, 5], ...s }
}
const work = (startTime: string, endTime: string, extra: Partial<RecurringSchedule> = {}) =>
  sch({ type: 'parent_work', startTime, endTime, ...extra })
const school = (startTime: string, endTime: string, extra: Partial<RecurringSchedule> = {}) =>
  sch({ type: 'child_school', childId: 'kid', startTime, endTime, ...extra })
const care = (startTime: string, endTime: string, extra: Partial<RecurringSchedule> = {}) =>
  sch({ type: 'care', childId: 'kid', startTime, endTime, ...extra })
const exception = (scheduleId: string, e: Partial<ScheduleException>): ScheduleException => ({
  id: `e-${scheduleId}`, scheduleId, date: MON, startTime: null, endTime: null, isCancelled: false, ...e,
})

describe('time helpers', () => {
  it('converts between HH:mm and minutes', () => {
    expect(toMinutes('15:20')).toBe(920)
    expect(toTime(920)).toBe('15:20')
    expect(toTime(5)).toBe('00:05')
  })

  it('subtracts covered time from busy time', () => {
    expect(subtract([{ start: 540, end: 1080 }], [{ start: 600, end: 700 }])).toEqual([
      { start: 540, end: 600 },
      { start: 700, end: 1080 },
    ])
  })
})

describe('occursOn', () => {
  it('repeats on the listed weekdays', () => {
    const s = work('09:00', '18:00', { daysOfWeek: [1] })
    expect(occursOn(s, MON)).toBe(true)
    expect(occursOn(s, TUE)).toBe(false)
  })

  it('limits a one-time schedule to its date', () => {
    const s = work('09:00', '18:00', { daysOfWeek: [1], date: MON })
    expect(occursOn(s, MON)).toBe(true)
    expect(occursOn(s, '2026-10-19')).toBe(false) // next Monday
  })
})

describe('computeGaps', () => {
  it('matches the documented example: school + 20 min commute vs work until 18:30', () => {
    const schedules = [work('09:00', '18:30', { parentLabel: 'mom' }), school('09:00', '15:00')]
    expect(computeGaps(kid, MON, schedules, [])).toEqual([{ start: '15:20', end: '18:30' }])
  })

  it('has no gap on a day the parent does not work', () => {
    const schedules = [work('09:00', '18:00', { parentLabel: 'mom', daysOfWeek: [2] }), school('09:00', '15:00')]
    expect(computeGaps(kid, MON, schedules, [])).toEqual([])
  })

  it('covers the gap with a care schedule', () => {
    const schedules = [work('09:00', '18:00', { parentLabel: 'mom' }), school('09:00', '13:00'), care('13:00', '18:00')]
    expect(computeGaps(noCommute, MON, schedules, [])).toEqual([])
  })

  it('drops gaps no longer than the commute', () => {
    // 15:20~15:40 is exactly the 20 min commute, so it isn't reported
    const schedules = [work('09:00', '15:40', { parentLabel: 'mom' }), school('09:00', '15:00')]
    expect(computeGaps(kid, MON, schedules, [])).toEqual([])
  })

  it('drops a morning gap that ends before the child is first covered', () => {
    const schedules = [work('07:00', '08:00', { parentLabel: 'mom' }), work('13:00', '18:00', { parentLabel: 'mom' }), school('09:00', '13:00')]
    expect(computeGaps(noCommute, MON, schedules, [])).toEqual([{ start: '13:00', end: '18:00' }])
  })

  describe('dual income', () => {
    it('counts only the hours both parents work', () => {
      const schedules = [
        work('09:00', '18:00', { parentLabel: 'mom' }),
        work('10:00', '17:00', { parentLabel: 'dad' }),
        school('09:00', '13:00'),
      ]
      expect(computeGaps(noCommute, MON, schedules, [])).toEqual([{ start: '13:00', end: '17:00' }])
    })

    it('has no gap on a day only one parent works', () => {
      const schedules = [
        work('09:00', '18:00', { parentLabel: 'mom', daysOfWeek: [1] }),
        work('09:00', '18:00', { parentLabel: 'dad', daysOfWeek: [2] }),
        school('09:00', '13:00'),
      ]
      expect(computeGaps(noCommute, MON, schedules, [])).toEqual([])
    })

    it('ignores untagged (older) work', () => {
      const schedules = [
        work('09:00', '17:00', { parentLabel: 'mom' }),
        work('09:00', '17:00', { parentLabel: 'dad' }),
        work('09:00', '19:00'), // untagged
        school('09:00', '13:00'),
      ]
      expect(computeGaps(noCommute, MON, schedules, [])).toEqual([{ start: '13:00', end: '17:00' }])
    })

    it('is not triggered by a one-time work schedule', () => {
      const schedules = [
        work('09:00', '18:00', { parentLabel: 'mom' }),
        work('09:00', '18:00', { parentLabel: 'dad', daysOfWeek: [2], date: TUE }),
        school('09:00', '13:00'),
      ]
      // Dad's single Tuesday shift must not make Monday a both-parents day
      expect(computeGaps(noCommute, MON, schedules, [])).toEqual([{ start: '13:00', end: '18:00' }])
    })
  })

  it('includes untagged work when only one parent is tagged', () => {
    const schedules = [work('09:00', '15:00', { parentLabel: 'mom' }), work('15:00', '18:00'), school('09:00', '13:00')]
    expect(computeGaps(noCommute, MON, schedules, [])).toEqual([{ start: '13:00', end: '18:00' }])
  })

  describe('exceptions', () => {
    it('turns the whole workday into a gap when school is cancelled that day', () => {
      const s = school('09:00', '13:00')
      const schedules = [work('09:00', '18:00', { parentLabel: 'mom' }), s]
      const exceptions = [exception(s.id, { isCancelled: true })]
      expect(computeGaps(noCommute, MON, schedules, exceptions)).toEqual([{ start: '09:00', end: '18:00' }])
    })

    it('uses the changed time for that day only', () => {
      const w = work('09:00', '18:00', { parentLabel: 'mom' })
      const schedules = [w, school('09:00', '13:00')]
      const exceptions = [exception(w.id, { startTime: '09:00', endTime: '15:00' })]
      expect(computeGaps(noCommute, MON, schedules, exceptions)).toEqual([{ start: '13:00', end: '15:00' }])
      expect(computeGaps(noCommute, TUE, schedules, exceptions)).toEqual([{ start: '13:00', end: '18:00' }])
    })

    it('ignores a leftover time change after the schedule moved to another weekday', () => {
      // A Monday "이 날만 시간 변경" stays in the DB when the work is later moved to Tuesday only
      const w = work('09:00', '18:00', { parentLabel: 'mom', daysOfWeek: [2] })
      const schedules = [w, school('09:00', '13:00')]
      const exceptions = [exception(w.id, { startTime: '09:00', endTime: '15:00' })]
      expect(computeGaps(noCommute, MON, schedules, exceptions)).toEqual([])
    })
  })

  it('counts a one-time schedule only on its date', () => {
    const schedules = [work('09:00', '18:00', { parentLabel: 'mom' }), school('09:00', '13:00'), care('13:00', '18:00', { daysOfWeek: [1], date: MON })]
    expect(computeGaps(noCommute, MON, schedules, [])).toEqual([])
    expect(computeGaps(noCommute, '2026-10-19', schedules, [])).toEqual([{ start: '13:00', end: '18:00' }])
  })

  it('ignores another child’s school', () => {
    const schedules = [work('09:00', '18:00', { parentLabel: 'mom' }), school('09:00', '13:00', { childId: 'other' })]
    expect(computeGaps(noCommute, MON, schedules, [])).toEqual([{ start: '09:00', end: '18:00' }])
  })
})

describe('care option overlap', () => {
  const option = { open_time: '14:00', close_time: '17:00' } as CareOption

  it('returns the part of the gap the option is open', () => {
    expect(overlapWithGap(option, { start: '13:00', end: '18:00' })).toEqual({ start: '14:00', end: '17:00' })
  })

  it('returns null when the option is closed for the whole gap', () => {
    expect(overlapWithGap(option, { start: '17:00', end: '19:00' })).toBeNull()
  })

  it('leaves what checked options do not cover', () => {
    expect(remainingGap({ start: '13:00', end: '18:00' }, [{ start: '14:00', end: '17:00' }])).toEqual([
      { start: '13:00', end: '14:00' },
      { start: '17:00', end: '18:00' },
    ])
  })
})

describe('matchPicks', () => {
  const gap = { start: '14:50', end: '15:30' }
  const candidates = ['a', 'b'].map((id) => ({
    option: { id, open_time: '14:00', close_time: '19:00' } as CareOption,
    overlap: gap,
  }))

  it('gives an untagged pick to only one of two options with the same overlap', () => {
    const picks = matchPicks(candidates, [care('14:50', '15:30')], gap)
    expect([...picks.keys()]).toEqual(['a'])
  })

  it('gives a tagged pick to its own option', () => {
    const picks = matchPicks(candidates, [care('14:50', '15:30', { careOptionId: 'b' })], gap)
    expect([...picks.keys()]).toEqual(['b'])
  })
})
