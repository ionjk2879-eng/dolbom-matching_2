export function Card({
  className = '',
  highlight = false,
  children,
}: {
  className?: string
  highlight?: boolean
  children: React.ReactNode
}) {
  return (
    <div
      className={`rounded-[20px] border border-line bg-ivory-card p-5 ${
        highlight ? 'shadow-[0_24px_40px_-28px_rgba(60,50,30,.45)]' : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}
