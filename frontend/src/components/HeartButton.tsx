export function HeartButton({
  active,
  onToggle,
  size = 20,
  className = '',
}: {
  active: boolean
  onToggle: (e: React.MouseEvent) => void
  size?: number
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={active ? '즐겨찾기 해제' : '즐겨찾기'}
      className={`focus-ring tap-target flex items-center justify-center transition-transform active:scale-90 ${className}`}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={active ? 'text-red-500' : 'text-ink-3'}
        aria-hidden="true"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  )
}
