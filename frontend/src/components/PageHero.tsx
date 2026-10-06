import { Link } from 'react-router-dom'

export function PageHero({
  title,
  desc,
  breadcrumb,
  tabs,
  activeTab,
  onTabChange,
}: {
  title: string
  desc?: string
  breadcrumb?: { label: string; to?: string }[]
  tabs?: { key: string; label: string }[]
  activeTab?: string
  onTabChange?: (key: string) => void
}) {
  return (
    <div className="bg-ivory-deep">
      <div className="mx-auto max-w-6xl px-4 py-10">
        {breadcrumb && (
          <nav className="mb-3 flex gap-1 text-xs text-ink-2">
            {breadcrumb.map((b, i) => (
              <span key={b.label} className="flex items-center gap-1">
                {i > 0 && <span>/</span>}
                {b.to ? (
                  <Link to={b.to} className="hover:text-ink-2">
                    {b.label}
                  </Link>
                ) : (
                  <span>{b.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-[28px] font-extrabold tracking-[-0.03em] text-ink">{title}</h1>
        {desc && <p className="mt-2 text-sm text-ink-2">{desc}</p>}
        {tabs && (
          <div role="tablist" className="mt-6 inline-flex gap-1 rounded-xl border border-line bg-ivory-deep-2 p-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={activeTab === t.key}
                onClick={() => onTabChange?.(t.key)}
                className={`focus-ring rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  activeTab === t.key ? 'bg-ivory text-ink' : 'text-ink-2 hover:text-ink'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
