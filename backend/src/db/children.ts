import type { Db } from './index'

export type Child = {
  id: string
  user_id: string
  name: string
  grade: number
  commute_minutes: number
  created_at: string
}

export const getChildrenByUser = (sql: Db, userId: string) =>
  sql<Child[]>`SELECT * FROM children WHERE user_id = ${userId} ORDER BY created_at`

export async function createChild(
  sql: Db,
  data: Pick<Child, 'user_id' | 'name' | 'grade' | 'commute_minutes'>
): Promise<Child> {
  const [row] = await sql<Child[]>`INSERT INTO children ${sql(data)} RETURNING *`
  return row
}

export async function updateChild(
  sql: Db,
  id: string,
  userId: string,
  patch: Partial<Pick<Child, 'name' | 'grade' | 'commute_minutes'>>
): Promise<Child | null> {
  const [row] = await sql<Child[]>`
    UPDATE children SET ${sql(patch)} WHERE id = ${id} AND user_id = ${userId} RETURNING *
  `
  return row ?? null
}

export async function deleteChild(sql: Db, id: string, userId: string): Promise<boolean> {
  const result = await sql`DELETE FROM children WHERE id = ${id} AND user_id = ${userId}`
  return result.count > 0
}
