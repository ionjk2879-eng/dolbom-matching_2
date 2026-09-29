import { gradesOverlap } from './grade'
import { weekdayOf } from './date'
import { coversDates, coversTime } from './time'
import type { Center } from './types'

type Conditions = { area: string; grade: string; time: string; selectedDates: string[] }

export function matchesConditions(c: Center, { area, grade, time, selectedDates }: Conditions) {
  return (
    (!area || c.district === area) &&
    (!grade || gradesOverlap(c.grade, grade)) &&
    coversTime(c.hours, time) &&
    coversDates(c.days, selectedDates)
  )
}

// Center is open on every given weekday ('월'…) for the whole start~end slot ('HH:MM')
export function fitsWeekly(c: Center, weekdays: string[], start: string, end: string) {
  const [open, close] = c.hours.split('~')
  return weekdays.every((d) => c.days.includes(d)) && open <= start && close >= end
}

export function fitsSlot(c: Center, date: string, start: string, end: string) {
  return fitsWeekly(c, [weekdayOf(date)], start, end)
}
