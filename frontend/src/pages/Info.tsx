import { useState } from 'react'
import { PageHero } from '../components/PageHero'
import { Chip } from '../components/Chip'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { PlaceholderImage } from '../components/PlaceholderImage'
import { useHashTab } from '../hooks/useHashTab'
import { infoArticles } from '../data/info'

const TABS = ['play', 'care', 'card', 'counsel']
const counselMethods = ['전화 상담', '방문 상담', '화상 상담']
const counselTopics = ['돌봄 기관 선택', '지원금 안내', '아이 발달', '학습·정서']

export function Info() {
  const [tab, setTab] = useHashTab(TABS, 'play')
  const [method, setMethod] = useState('')
  const [topics, setTopics] = useState<string[]>([])
  const [content, setContent] = useState('')
  const [done, setDone] = useState(false)

  const toggleTopic = (t: string) => setTopics((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))

  const category = tab as 'play' | 'care' | 'card' | 'counsel'
  const list = category === 'counsel' ? [] : infoArticles.filter((a) => a.category === category)
  const featured = list.find((a) => a.featured) ?? list[0]
  const rest = list.filter((a) => a.id !== featured?.id)

  return (
    <div>
      <PageHero
        title="양육정보"
        desc="놀이부터 상담까지, 양육에 필요한 정보를 모았어요"
        tabs={[
          { key: 'play', label: '놀이' },
          { key: 'care', label: '양육' },
          { key: 'card', label: '카드뉴스' },
          { key: 'counsel', label: '전문가 상담' },
        ]}
        activeTab={tab}
        onTabChange={setTab}
      />

      <div className="mx-auto max-w-6xl px-4 py-10">
        {category !== 'counsel' && (
          <>
            {featured && (
              <Card highlight className="flex flex-col gap-4 md:flex-row">
                <PlaceholderImage
                  caption={category === 'card' ? '1:1' : '16:9 재생'}
                  ratio={category === 'card' ? 'aspect-square' : 'aspect-video'}
                  className="md:w-96"
                />
                <div>
                  <span className="rounded-full bg-green-soft px-2.5 py-1 text-xs font-bold text-green">추천</span>
                  <p className="mt-2 text-lg font-bold text-ink">{featured.title}</p>
                  <p className="mt-2 text-sm text-ink-2">{featured.desc}</p>
                </div>
              </Card>
            )}
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {rest.map((a) => (
                <div key={a.id}>
                  <PlaceholderImage caption={category === 'card' ? '1:1' : '16:9'} ratio={category === 'card' ? 'aspect-square' : 'aspect-video'} />
                  <p className="mt-2 text-sm font-bold text-ink">{a.title}</p>
                  <p className="mt-1 text-xs text-ink-3">{a.desc}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {category === 'counsel' &&
          (done ? (
            <Card className="mx-auto max-w-md text-center">
              <p className="text-lg font-bold text-ink">상담 신청이 접수되었어요</p>
              <p className="mt-2 text-sm text-ink-2">담당 상담사가 확인 후 연락드릴게요.</p>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <p className="text-sm font-bold text-ink">상담 안내</p>
                <ul className="mt-3 space-y-2 text-sm text-ink-2">
                  <li>운영 시간: 평일 09:00~18:00</li>
                  <li>상담 방식: 전화 · 방문 · 화상</li>
                  <li>대상: 대전광역시 거주 양육자</li>
                </ul>
              </Card>
              <Card className="flex flex-col gap-5">
                <div>
                  <p className="text-sm font-bold text-ink">상담 방식</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {counselMethods.map((m) => (
                      <Chip key={m} selected={method === m} onClick={() => setMethod(m)}>
                        {m}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-ink">고민 주제</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {counselTopics.map((t) => (
                      <Chip key={t} selected={topics.includes(t)} onClick={() => toggleTopic(t)}>
                        {t}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div>
                  <label htmlFor="counsel-content" className="text-sm font-bold text-ink">
                    상담 내용
                  </label>
                  <textarea
                    id="counsel-content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={4}
                    className="focus-ring mt-2 w-full rounded-xl border border-line-2 bg-ivory-card p-3 text-sm"
                  />
                </div>
                <Button onClick={() => setDone(true)} disabled={!method}>
                  상담 신청하기
                </Button>
              </Card>
            </div>
          ))}
      </div>
    </div>
  )
}
