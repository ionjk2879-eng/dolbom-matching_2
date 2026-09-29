import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHero } from '../components/PageHero'
import { Chip } from '../components/Chip'
import { Card } from '../components/Card'
import { useHashTab } from '../hooks/useHashTab'
import { newsItems } from '../data/info'
import { costByType, incomeBrackets, getSubsidy } from '../data/subsidy'

const TABS = ['how', 'cost', 'news', 'faq', 'sitemap']

const howSteps = {
  user: [
    { title: '회원가입', desc: '사용자로 가입하고 아이 정보를 등록해요' },
    { title: '조건 검색', desc: '지역·학년·시간으로 돌봄기관을 찾아요' },
    { title: '요청 또는 상담', desc: '마음에 드는 곳에 상담을 신청해요' },
    { title: '이용 시작', desc: '센터와 일정을 조율하고 이용을 시작해요' },
  ],
  center: [
    { title: '센터 등록', desc: '운영자로 가입하고 센터 정보를 등록해요' },
    { title: '승인 대기', desc: '관리자 검토 후 1~2일 내 승인돼요' },
    { title: '요청 확인', desc: '조건에 맞는 돌봄 요청을 확인해요' },
    { title: '제안 보내기', desc: '학부모에게 제안을 보내고 상담을 진행해요' },
  ],
}

const faqCategories = ['전체', '이용', '비용', '센터']
const faqs = [
  { category: '이용', q: '돌봄 요청은 몇 곳에 전달되나요?', a: '입력한 조건에 맞는 모든 센터에 동시에 전달돼요.' },
  { category: '이용', q: '상담은 어떻게 신청하나요?', a: '돌봄 찾기에서 원하는 센터를 선택 후 상담 신청 버튼을 눌러주세요.' },
  { category: '비용', q: '지원금은 어떻게 신청하나요?', a: '이용 안내 > 비용 안내의 간편 확인에서 예상 금액을 먼저 확인해보세요.' },
  { category: '비용', q: '무료로 이용할 수 있는 기관이 있나요?', a: '지역아동센터, 공동육아나눔터는 대부분 무료로 운영돼요.' },
  { category: '센터', q: '센터 운영자는 어떻게 가입하나요?', a: '회원가입에서 센터 운영자를 선택하고 사업자 정보를 입력해주세요.' },
]

const sitemapSections = [
  { title: '돌봄 찾기', links: [{ label: '지도에서 찾기', to: '/find' }] },
  {
    title: '돌봄 요청',
    links: [
      { label: '요청 등록', to: '/request#new' },
      { label: '받은 제안', to: '/request#offers' },
      { label: '요청 관리', to: '/request#manage' },
    ],
  },
  {
    title: '문화·행사',
    links: [
      { label: '이달의 행사', to: '/events#month' },
      { label: '우리 동네 행사', to: '/events#area' },
      { label: '교육 행사', to: '/events#edu' },
    ],
  },
  {
    title: '양육정보',
    links: [
      { label: '놀이', to: '/info#play' },
      { label: '양육', to: '/info#care' },
      { label: '카드뉴스', to: '/info#card' },
      { label: '전문가 상담', to: '/info#counsel' },
    ],
  },
  {
    title: '이용 안내',
    links: [
      { label: '이용 방법', to: '/guide#how' },
      { label: '비용 안내', to: '/guide#cost' },
      { label: '공지사항', to: '/guide#news' },
      { label: 'FAQ', to: '/guide#faq' },
    ],
  },
  {
    title: '계정',
    links: [
      { label: '로그인', to: '/login' },
      { label: '회원가입', to: '/signup' },
    ],
  },
]

export function Guide() {
  const [tab, setTab] = useHashTab(TABS, 'how')
  const [role, setRole] = useState<'user' | 'center'>('user')
  const [children, setChildren] = useState(0)
  const [income, setIncome] = useState(0)
  const [faqCategory, setFaqCategory] = useState('전체')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const filteredFaqs = faqs.filter((f) => faqCategory === '전체' || f.category === faqCategory)

  return (
    <div>
      <PageHero
        title="이용 안내"
        tabs={[
          { key: 'how', label: '이용 방법' },
          { key: 'cost', label: '비용 안내' },
          { key: 'news', label: '공지사항' },
          { key: 'faq', label: 'FAQ' },
          { key: 'sitemap', label: '사이트맵' },
        ]}
        activeTab={tab}
        onTabChange={setTab}
      />

      <div className="mx-auto max-w-6xl px-4 py-10">
        {tab === 'how' && (
          <div>
            <div role="tablist" className="inline-flex gap-1 rounded-xl border border-line bg-ivory-deep-2 p-1">
              <button
                role="tab"
                aria-selected={role === 'user'}
                onClick={() => setRole('user')}
                className={`focus-ring rounded-lg px-4 py-2 text-sm font-semibold ${role === 'user' ? 'bg-ivory text-ink' : 'text-ink-2'}`}
              >
                사용자
              </button>
              <button
                role="tab"
                aria-selected={role === 'center'}
                onClick={() => setRole('center')}
                className={`focus-ring rounded-lg px-4 py-2 text-sm font-semibold ${role === 'center' ? 'bg-ivory text-ink' : 'text-ink-2'}`}
              >
                센터 운영자
              </button>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-4">
              {howSteps[role].map((s, i) => (
                <Card key={s.title}>
                  <span className="text-xs font-bold text-green">STEP {i + 1}</span>
                  <p className="mt-2 text-sm font-bold text-ink">{s.title}</p>
                  <p className="mt-1 text-xs text-ink-3">{s.desc}</p>
                </Card>
              ))}
            </div>
            <Link
              to={role === 'user' ? '/find' : '/signup'}
              className="focus-ring mt-6 inline-block rounded-xl bg-green px-5 py-3 text-sm font-bold text-white"
            >
              {role === 'user' ? '돌봄기관 찾아보기' : '센터 회원가입 하기'}
            </Link>
          </div>
        )}

        {tab === 'cost' && (
          <div>
            <div className="grid gap-4 md:grid-cols-4">
              {costByType.map((c) => (
                <Card key={c.type}>
                  <p className="text-sm font-bold text-ink">{c.type}</p>
                  <p className="mt-2 text-sm text-ink-2">{c.range}</p>
                </Card>
              ))}
            </div>
            <div className="mt-8 rounded-[20px] bg-ink p-6 text-white">
              <p className="text-sm font-bold">지원금 간편 확인</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs text-white/70">자녀 수</p>
                  <div className="mt-2 flex gap-2">
                    {[1, 2, 3].map((n) => (
                      <button
                        key={n}
                        onClick={() => setChildren(n - 1)}
                        className={`focus-ring rounded-full border px-4 py-1.5 text-sm ${
                          children === n - 1 ? 'border-sand bg-sand text-ink' : 'border-white/30 text-white'
                        }`}
                      >
                        {n}명
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-white/70">소득 구간</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {incomeBrackets.map((b, i) => (
                      <button
                        key={b}
                        onClick={() => setIncome(i)}
                        className={`focus-ring rounded-full border px-3 py-1.5 text-xs ${
                          income === i ? 'border-sand bg-sand text-ink' : 'border-white/30 text-white'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <p className="mt-5 text-lg font-extrabold text-sand">
                예상 월 지원금: {getSubsidy(children, income).toLocaleString()}원
              </p>
            </div>
          </div>
        )}

        {tab === 'news' && (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-ink-2">
              <tr>
                <th className="px-3 py-3 font-semibold">번호</th>
                <th className="px-3 py-3 font-semibold">구분</th>
                <th className="px-3 py-3 font-semibold">제목</th>
                <th className="px-3 py-3 font-semibold">등록일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {newsItems.map((n) => (
                <tr key={n.id}>
                  <td className="px-3 py-3 text-ink-3">{n.id}</td>
                  <td className="px-3 py-3">
                    <span className="rounded-full bg-ivory-deep px-2.5 py-1 text-xs font-semibold text-ink-2">{n.tag}</span>
                  </td>
                  <td className="px-3 py-3 text-ink">{n.title}</td>
                  <td className="px-3 py-3 text-ink-3">{n.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === 'faq' && (
          <div>
            <div className="flex flex-wrap gap-2">
              {faqCategories.map((c) => (
                <Chip key={c} selected={faqCategory === c} onClick={() => setFaqCategory(c)}>
                  {c}
                </Chip>
              ))}
            </div>
            <div className="mt-5 divide-y divide-line rounded-2xl border border-line">
              {filteredFaqs.map((f, i) => (
                <div key={f.q}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    aria-expanded={openFaq === i}
                    className="focus-ring flex w-full items-center justify-between px-5 py-4 text-left text-sm font-semibold text-ink"
                  >
                    {f.q}
                    <span>{openFaq === i ? '−' : '+'}</span>
                  </button>
                  {openFaq === i && <p className="px-5 pb-4 text-sm text-ink-2">{f.a}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'sitemap' && (
          <div className="grid gap-4 md:grid-cols-3">
            {sitemapSections.map((s) => (
              <Card key={s.title}>
                <p className="text-sm font-bold text-ink">{s.title}</p>
                <ul className="mt-3 space-y-2">
                  {s.links.map((l) => (
                    <li key={l.label}>
                      <Link to={l.to} className="focus-ring text-sm text-ink-2 hover:text-green">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
