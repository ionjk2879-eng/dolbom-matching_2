import postgres from 'postgres'

export function createDb(databaseUrl: string) {
  return postgres(databaseUrl, { max: 1 })
}

export type Db = ReturnType<typeof createDb>
