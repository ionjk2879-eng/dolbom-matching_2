import type { Db } from './index'
import type { User } from '../types'

export async function upsertUser(
  sql: Db,
  data: {
    provider: string
    provider_id: string
    email?: string | null
    name?: string | null
    profile_image?: string | null
  }
): Promise<User> {
  const [user] = await sql<User[]>`
    INSERT INTO users (provider, provider_id, email, name, profile_image)
    VALUES (${data.provider}, ${data.provider_id}, ${data.email ?? null}, ${data.name ?? null}, ${data.profile_image ?? null})
    ON CONFLICT (provider, provider_id) DO UPDATE SET
      email = EXCLUDED.email,
      name = EXCLUDED.name,
      profile_image = EXCLUDED.profile_image,
      updated_at = NOW()
    RETURNING *
  `
  return user
}

export async function findUserById(sql: Db, id: string): Promise<User | null> {
  const [user] = await sql<User[]>`SELECT * FROM users WHERE id = ${id}`
  return user ?? null
}
