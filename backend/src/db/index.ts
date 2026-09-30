import { neon } from '@neondatabase/serverless'

export function createDb(databaseUrl: string) {
  const sql = neon(databaseUrl)
  return Object.assign(sql, { end: async () => {} })
}

export type Db = ReturnType<typeof createDb>
