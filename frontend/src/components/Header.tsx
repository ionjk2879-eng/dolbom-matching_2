import { useRef, useState, type KeyboardEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'

type MenuItem = {
  label: string
  to: string
  desc: string
  links: { label: string; to: string }[]
}

const menu: MenuItem[] = [
  {
    label: '돌봄 찾기',
    to: '/find',
    desc: '지도에서 우리 동네 돌봄기관을 찾아보세요',
    links: [
      { label: '지도에서 찾기', to: '/find' },
      { label: '조건별 검색', to: '/find' },
      { label: '추천 센터 보기', to: '/' },
    ],
  },
  {
    label: '돌봄 요청',
    to: '/request',
    desc: '필요한 돌봄을 등록하면 센터가 제안을 보내드려요',
    links: [
      { label: '요청 등록', to: '/request#new' },
      { label: '받은 제안', to: '/request#offers' },
      { label: '요청 관리', to: '/request#manage' },
    ],
  },
  {
    label: '문화·행사',
    to: '/events',
    desc: '아이와 함께하는 지역 문화 행사를 만나보세요',
    links: [
      { label: '이달의 행사', to: '/events#month' },
      { label: '우리 동네 행사', to: '/events#area' },
      { label: '교육 행사', to: '/events#edu' },
    ],
  },
  {
    label: '양육정보',
    to: '/info',
    desc: '놀이부터 상담까지 양육에 필요한 정보',
    links: [
      { label: '놀이 정보', to: '/info#play' },
      { label: '양육 정보', to: '/info#care' },
      { label: '카드뉴스', to: '/info#card' },
      { label: '전문가 상담', to: '/info#counsel' },
    ],
  },
  {
    label: '이용 안내',
    to: '/guide',
    desc: 'After School을 처음이신가요?',
    links: [
      { label: '이용 방법', to: '/guide#how' },
      { label: '비용 안내', to: '/guide#cost' },
      { label: '자주 묻는 질문', to: '/guide#faq' },
      { label: '전체 사이트맵', to: '/guide#sitemap' },
    ],
  },
]

export function Header() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navRef = useRef<HTMLElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  // Set when Escape moves focus back to the nav, so that focus doesn't reopen the menu
  const skipFocusOpen = useRef(false)

  const onNavFocus = () => {
    if (skipFocusOpen.current) {
      skipFocusOpen.current = false
      return
    }
    setOpen(true)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key !== 'Escape' || !open) return
    setOpen(false)
    if (dropdownRef.current?.contains(document.activeElement)) {
      skipFocusOpen.current = true
      navRef.current?.querySelector('a')?.focus()
    }
  }

  return (
    <header
      className="relative border-b border-line bg-ivory-card"
      onMouseLeave={() => setOpen(false)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false)
      }}
      onKeyDown={onKeyDown}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-ivory-deep text-lg font-extrabold text-green">
            AS
          </span>
          <span className="text-xl font-extrabold text-ink">After School</span>
        </Link>

        <nav ref={navRef} aria-label="주요 메뉴" onMouseEnter={() => setOpen(true)} onFocus={onNavFocus}>
          <ul className="flex gap-8">
            {menu.map((m) => {
              const active = location.pathname === m.to
              return (
                <li key={m.to}>
                  <Link
                    to={m.to}
                    className={`focus-ring inline-block border-b-2 py-2 text-sm font-semibold transition ${
                      active ? 'border-green text-green' : 'border-transparent text-ink-2 hover:text-ink'
                    }`}
                  >
                    {m.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <Link to="/login" className="focus-ring text-sm font-semibold text-ink-2 hover:text-ink">
            로그인
          </Link>
          <Link
            to="/signup"
            className="focus-ring rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            회원가입
          </Link>
        </div>
      </div>

      {open && (
        <div
          ref={dropdownRef}
          onMouseEnter={() => setOpen(true)}
          className="absolute inset-x-0 top-full z-30 border-b border-line bg-ivory-card shadow-[0_24px_40px_-28px_rgba(60,50,30,.45)]"
        >
          <div className="mx-auto grid max-w-6xl grid-cols-5 gap-6 px-4 py-8">
            {menu.map((m) => (
              <div key={m.to}>
                <Link
                  to={m.to}
                  onClick={() => setOpen(false)}
                  className="focus-ring text-sm font-bold text-ink hover:text-green"
                >
                  {m.label}
                </Link>
                <p className="mt-1 text-xs text-ink-3">{m.desc}</p>
                <ul className="mt-4 flex flex-col gap-2">
                  {m.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        to={l.to}
                        onClick={() => setOpen(false)}
                        className="focus-ring text-sm text-ink-2 hover:text-green"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
