import { isDemoOption } from '../api/careOptions'
import type { CareOption } from '../data/types'

// Tells the user when the list fell back to demo options, so fake data isn't mistaken for real
export function DemoNotice({ options, className = '' }: { options: CareOption[]; className?: string }) {
  if (!options.some(isDemoOption)) return null

  return (
    <p role="status" className={`rounded-xl border border-error/30 bg-warn-bg px-4 py-2.5 text-sm text-warn ${className}`}>
      실제 돌봄 기관 정보를 불러오지 못해 예시 데이터를 보여드리고 있어요.
    </p>
  )
}
