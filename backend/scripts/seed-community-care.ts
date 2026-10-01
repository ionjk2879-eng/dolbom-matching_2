/**
 * 전국지역아동센터표준데이터 JSON → care_providers 삽입 (대전광역시 필터)
 *
 * 실행 방법:
 *   JSON_PATH=<파일경로> npx tsx scripts/seed-community-care.ts
 *
 * 예:
 *   JSON_PATH="C:/Users/SBS/Downloads/전국지역아동센터표준데이터.json" npx tsx scripts/seed-community-care.ts
 */

import postgres from 'postgres'
import { readFileSync } from 'fs'
import { resolve } from 'path'

function loadDevVars(): Record<string, string> {
  try {
    const raw = readFileSync(resolve(__dirname, '../.dev.vars'), 'utf-8')
    return Object.fromEntries(
      raw.split('\n')
        .filter(l => l.includes('=') && !l.startsWith('#'))
        .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
    )
  } catch { return {} }
}

const vars = loadDevVars()
const DATABASE_URL = process.env.DATABASE_URL ?? vars.DATABASE_URL
const JSON_PATH = process.env.JSON_PATH

if (!DATABASE_URL) { console.error('DATABASE_URL 없음'); process.exit(1) }
if (!JSON_PATH) { console.error('JSON_PATH 없음\n실행: JSON_PATH="경로" npx tsx scripts/seed-community-care.ts'); process.exit(1) }

type RawRecord = {
  센터명: string
  시도명: string
  시군구명: string
  소재지도로명주소: string
  소재지지번주소: string
  위도: string
  경도: string
  전화번호: string
}

async function main() {
  const sql = postgres(DATABASE_URL!, { max: 1 })

  console.log(`파일 읽는 중: ${JSON_PATH}`)
  const raw = readFileSync(JSON_PATH!, 'utf-8')
  const json = JSON.parse(raw) as { records: RawRecord[] }

  const daejeon = json.records.filter(r => r.시도명 === '대전광역시')
  console.log(`대전광역시 필터 결과: ${daejeon.length}건`)

  await sql`DELETE FROM care_providers WHERE type = 'community_care'`

  const rows = daejeon.map(r => ({
    name: r.센터명,
    type: 'community_care' as const,
    address: r.소재지도로명주소 || r.소재지지번주소,
    latitude: r.위도 ? parseFloat(r.위도) : null,
    longitude: r.경도 ? parseFloat(r.경도) : null,
    min_grade: 1,
    max_grade: 6,
    open_time: '14:00',  // ponytail: API에 운영시간 없음, 지역아동센터 통상값
    close_time: '19:00',
    cost_per_hour: 0,
    phone: r.전화번호 || null,
    url: null,
  }))

  await sql`INSERT INTO care_providers ${sql(rows)}`
  console.log(`삽입 완료: ${rows.length}건`)

  await sql.end()
}

main().catch(e => { console.error(e); process.exit(1) })
