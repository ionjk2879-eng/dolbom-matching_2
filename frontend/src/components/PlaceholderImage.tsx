export function PlaceholderImage({
  caption,
  className = '',
  ratio = 'aspect-video',
}: {
  caption: string
  className?: string
  ratio?: string
}) {
  return (
    <div
      className={`placeholder-stripe flex items-end rounded-xl border border-line-3 p-2 ${ratio} ${className}`}
    >
      <span className="rounded bg-ivory-card/80 px-2 py-1 font-mono text-[11px] text-ink-3">
        {caption}
      </span>
    </div>
  )
}
