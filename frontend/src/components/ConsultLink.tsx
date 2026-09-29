import { Link } from 'react-router-dom'
import { useConsultStore } from '../store/consultStore'

// "상담 신청" link to a center, or a done label once the user has already applied
export function ConsultLink({ centerId, className = '' }: { centerId: string; className?: string }) {
  const applied = useConsultStore((s) => s.consults.some((c) => c.centerId === centerId))
  if (applied) return <span className={`font-semibold text-ink-3 ${className}`}>상담 신청 완료</span>
  return (
    <Link
      to={`/centers/${centerId}/consult`}
      className={`focus-ring font-semibold text-green underline hover:text-ink ${className}`}
    >
      상담 신청
    </Link>
  )
}
