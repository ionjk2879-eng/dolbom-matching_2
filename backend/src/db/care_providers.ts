import type { Db } from './index'

export type CareProvider = {
  id: string
  name: string
  type: 'school_care' | 'community_care' | 'child_care_service' | 'academy' | 'babysitter'
  address: string
  latitude: number | null
  longitude: number | null
  min_grade: number | null
  max_grade: number | null
  open_time: string
  close_time: string
  cost_per_hour: number
  phone: string | null
  created_at: string
}

export const findCareProviderById = (sql: Db, id: string) =>
  sql<CareProvider[]>`SELECT * FROM care_providers WHERE id = ${id}`

export const findCareProviders = (
  sql: Db,
  startTime: string,
  endTime: string,
  grade: number
) =>
  sql<CareProvider[]>`
    SELECT * FROM care_providers
    WHERE open_time <= ${startTime}::time
      AND close_time >= ${endTime}::time
      AND (min_grade IS NULL OR min_grade <= ${grade})
      AND (max_grade IS NULL OR max_grade >= ${grade})
    ORDER BY cost_per_hour
  `
