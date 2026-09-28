import postgres from 'postgres'

export const createDb = (databaseUrl: string) => postgres(databaseUrl)

export type Db = ReturnType<typeof createDb>
