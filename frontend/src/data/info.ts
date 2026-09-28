import type { InfoArticle, NewsItem } from './types'

export const infoArticles: InfoArticle[] = [
  { id: 'i1', category: 'play', title: '집에서 하는 오감놀이 10가지', desc: '준비물 없이 바로 해볼 수 있는 오감놀이 모음', featured: true },
  { id: 'i2', category: 'play', title: '비 오는 날 실내놀이 아이디어', desc: '날씨와 상관없이 즐거운 놀이 시간' },
  { id: 'i3', category: 'play', title: '형제자매가 함께하는 협동놀이', desc: '다투지 않고 함께 노는 방법' },
  { id: 'i4', category: 'care', title: '초등 저학년 방과 후 시간표 짜기', desc: '무리 없는 하루 루틴 만들기' },
  { id: 'i5', category: 'care', title: '아이 혼자 있는 시간, 안전 체크리스트', desc: '자기주도 돌봄을 위한 준비' },
  { id: 'i6', category: 'care', title: '편식하는 아이 식습관 지도법', desc: '전문가가 알려주는 실전 팁' },
  { id: 'i7', category: 'card', title: '한눈에 보는 돌봄 지원금 총정리', desc: '카드뉴스로 보는 지원 혜택' },
  { id: 'i8', category: 'card', title: '다함께돌봄센터 이용 절차', desc: '신청부터 이용까지 5단계' },
  { id: 'i9', category: 'card', title: '방학 중 돌봄 공백 대비법', desc: '미리 준비하는 방학 돌봄' },
]

export const newsItems: NewsItem[] = [
  { id: 1, tag: '공지', title: '2026년 2학기 돌봄교실 신청 안내', date: '2026-09-20' },
  { id: 2, tag: '모집', title: '다함께돌봄센터 종사자 모집', date: '2026-09-18' },
  { id: 3, tag: '행사', title: '가을 문화 행사 달력이 공개되었어요', date: '2026-09-15' },
  { id: 4, tag: '공지', title: '돌봄 지원금 소득 기준 변경 안내', date: '2026-09-10' },
  { id: 5, tag: '모집', title: '공동육아나눔터 이용 회원 모집', date: '2026-09-05' },
]
