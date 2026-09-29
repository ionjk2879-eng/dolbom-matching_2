export function ShareToggle({
  title,
  desc,
  checked,
  onChange,
}: {
  title: string
  desc: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div>
        <p className="text-sm font-bold text-ink">{title}</p>
        <p className="mt-1 text-xs text-ink-3">{desc}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        onClick={() => onChange(!checked)}
        className={`focus-ring relative h-7 w-12 shrink-0 rounded-full transition ${checked ? 'bg-green' : 'bg-line-3'}`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${checked ? 'left-6' : 'left-1'}`}
        />
      </button>
    </div>
  )
}
