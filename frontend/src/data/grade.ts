// Grade labels like '유아', '초1~2', '초1~6', '초4~중2', '유아~초3' mapped to a numeric range (유아=0, 초n=n, 중n=6+n)
function level(part: string, prefix: string) {
  if (part === '유아') return 0
  const m = part.match(/^(초|중)?(\d)$/)
  if (!m) return NaN
  return ((m[1] ?? prefix) === '중' ? 6 : 0) + Number(m[2])
}

function gradeRange(grade: string): [number, number] {
  const [from, to = from] = grade.split('~')
  const prefix = from.match(/^(초|중)/)?.[1] ?? '초'
  return [level(from, prefix), level(to, prefix)]
}

export function gradesOverlap(a: string, b: string) {
  const [aFrom, aTo] = gradeRange(a)
  const [bFrom, bTo] = gradeRange(b)
  return aFrom <= bTo && bFrom <= aTo
}
