import { gradesOverlap } from './grade'
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
