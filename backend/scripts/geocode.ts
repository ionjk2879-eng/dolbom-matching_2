/**
 * care_providers 중 좌표 없는 레코드를 Kakao 주소 검색 API로 채움
 *
 * 실행 방법:
 *   npx tsx scripts/geocode.ts
 *
 * .dev.vars 의 DATABASE_URL, KAKAO_CLIENT_ID 를 자동으로 읽음
 * 별도로 지정하려면: DATABASE_URL=... KAKAO_REST_API_KEY=... npx tsx scripts/geocode.ts
 */

import postgres from 'postgres'
import { readFileSync } from 'fs'
import { resolve } from 'path'

function loadDevVars(): Record<string, string> {
  try {
    const raw = readFileSync(resolve(import.meta.dirname, '../.dev.vars'), 'utf-8')
    return Object.fromEntries(
      raw.split('\n')
        .filter(l => l.includes('=') && !l.startsWith('#'))
        .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
    )
  } catch { return {} }
}

const vars = loadDevVars()
const DATABASE_URL = process.env.DATABASE_URL ?? vars.DATABASE_URL
const KAKAO_KEY = process.env.KAKAO_REST_API_KEY ?? vars.KAKAO_CLIENT_ID

if (!DATABASE_URL) { console.error('DATABASE_URL 없음'); process.exit(1) }
if (!KAKAO_KEY) { console.error('KAKAO_CLIENT_ID (.dev.vars) 또는 KAKAO_REST_API_KEY 환경변수 필요'); process.exit(1) }

type KakaoDoc = {
  address?: { x: string; y: string }
  road_address?: { x: string; y: string }
}

async function geocode(address: string): Promise<{ lat: number; lng: number } | null> {
  const res = await fetch(
    `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`,
    { headers: { Authorization: `KakaoAK ${KAKAO_KEY}` } }
  )
  if (!res.ok) {
    console.warn(`  API 오류 ${res.status}: ${address}`)
    return null
  }
  const data = await res.json() as { documents: KakaoDoc[] }
  const doc = data.documents?.[0]
  if (!doc) return null
  const x = parseFloat((doc.address?.x ?? doc.road_address?.x) ?? '')
  const y = parseFloat((doc.address?.y ?? doc.road_address?.y) ?? '')
  return (x && y) ? { lat: y, lng: x } : null
}

async function main() {
  const sql = postgres(DATABASE_URL!, { max: 1 })

  const rows = await sql<{ id: string; address: string }[]>`
    SELECT id, address FROM care_providers
    WHERE latitude IS NULL OR longitude IS NULL
    ORDER BY created_at
  `
  console.log(`좌표 없는 레코드: ${rows.length}건 — 약 ${Math.ceil(rows.length * 0.15 / 60)}분 소요 예상`)

  let ok = 0, fail = 0
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const coords = await geocode(row.address)
    if (coords) {
      await sql`UPDATE care_providers SET latitude = ${coords.lat}, longitude = ${coords.lng} WHERE id = ${row.id}`
      ok++
    } else {
      fail++
    }
    if ((i + 1) % 100 === 0 || i === rows.length - 1) {
      process.stdout.write(`\r진행: ${i + 1}/${rows.length}  성공 ${ok}  실패 ${fail}   `)
    }
    await new Promise(r => setTimeout(r, 150))
  }

  console.log(`\n완료: 성공 ${ok}건, 실패 ${fail}건`)
  await sql.end()
}

main().catch(e => { console.error(e); process.exit(1) })
