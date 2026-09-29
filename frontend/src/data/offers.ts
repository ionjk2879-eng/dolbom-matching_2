import type { Offer } from './types'

export const offers: Offer[] = [
  {
    id: 'o1',
    centerId: 'c1',
    message: '아이 학년과 시간이 저희 센터와 잘 맞아요. 상담으로 자세히 안내드릴게요.',
    start: '2026-10-06',
    time: '13:00~19:30',
    fee: 180000,
    bus: true,
    status: 'pending',
  },
  {
    id: 'o2',
    centerId: 'c4',
    message: '차량 운행 가능하며 저녁 7시 이후에도 안심하고 맡기실 수 있어요.',
    start: '2026-10-07',
    time: '14:00~21:00',
    fee: 100000,
    bus: true,
    status: 'pending',
  },
  {
    id: 'o3',
    centerId: 'c2',
    message: '무료로 운영되는 지역아동센터입니다. 상담 후 배정 도와드릴게요.',
    start: '2026-10-08',
    time: '12:30~18:00',
    fee: 0,
    bus: false,
    status: 'accepted',
  },
]
