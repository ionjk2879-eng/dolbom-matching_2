import postgres from 'postgres'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' })
const schema = readFileSync(join(__dirname, 'src/db/schema.sql'), 'utf8')

await sql.unsafe(schema)
await sql.end()
console.log('✅ 스키마 적용 완료')
