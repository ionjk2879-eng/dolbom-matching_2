export function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`focus-ring tap-target rounded-full border px-4 py-2 text-sm font-medium transition ${
        selected
          ? 'border-green bg-green-soft text-green'
          : 'border-line-2 bg-ivory-card text-ink-2 hover:border-green/50'
      }`}
    >
      {children}
    </button>
  )
}
