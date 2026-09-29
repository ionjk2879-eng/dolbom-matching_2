export const incomeBrackets = ['기준중위소득 60% 이하', '60~120%', '120~150%', '150% 초과'] as const

export const childrenCounts = [1, 2, 3] as const

// [자녀 수 index][소득 구간 index] = 월 예상 지원금(원)
export const subsidyTable: number[][] = [
  [150000, 100000, 50000, 0],
  [200000, 140000, 80000, 20000],
  [260000, 190000, 120000, 40000],
]

export function getSubsidy(childrenIndex: number, incomeIndex: number): number {
  return subsidyTable[childrenIndex]?.[incomeIndex] ?? 0
}

export const costByType = [
  { type: '다함께돌봄센터', range: '월 10~20만원' },
  { type: '지역아동센터', range: '무료~월 5만원' },
  { type: '초등돌봄교실', range: '무료~월 5만원' },
  { type: '청소년방과후아카데미', range: '월 5~15만원' },
]
