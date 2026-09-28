export function SeatBadge({ seats }: { seats: number }) {
  if (seats === 0) {
    return (
      <span className="rounded-full bg-line-3 px-3 py-1 text-xs font-semibold text-ink-2">
        대기 신청
      </span>
    )
  }
  if (seats <= 2) {
    return (
      <span className="rounded-full bg-warn-bg px-3 py-1 text-xs font-semibold text-warn">
        잔여 {seats}석
      </span>
    )
  }
  return (
    <span className="rounded-full bg-green-soft px-3 py-1 text-xs font-semibold text-green">
      잔여 {seats}석
    </span>
  )
}
