# After School

학부모–돌봄센터 매칭 웹사이트.

## 실행 방법

```bash
npm install
npm run dev
```

`npm run build`로 프로덕션 빌드, `npx tsc --noEmit`으로 타입 체크를 할 수 있습니다.

## 폴더 구조

```
src/
  api/         목업 데이터를 Promise로 감싼 함수 (추후 실제 API로 교체 지점)
  components/  공통 컴포넌트 (Header, PageHero, Chip, Button, Card, SeatBadge, Calendar, MapView, Footer 등)
  data/        목업 데이터와 타입 정의
  hooks/       공용 훅 (useHashTab: 탭 상태를 URL hash와 동기화)
  pages/       라우트별 페이지 (Home, Find, Request, Events, Info, Guide, Login, Signup)
  store/       matchStore (Zustand) — 메인 페이지 맞춤 매칭 조건을 /find와 공유
```

## 라우트

| 경로 | 페이지 |
|---|---|
| `/` | 메인 |
| `/find` | 돌봄 찾기 |
| `/request` | 돌봄 요청 (`#new` `#offers` `#manage`) |
| `/events` | 문화·행사 (`#month` `#area` `#edu`) |
| `/info` | 양육정보 (`#play` `#care` `#card` `#counsel`) |
| `/guide` | 이용 안내 (`#how` `#cost` `#news` `#faq` `#sitemap`) |
| `/login` | 로그인 |
| `/signup` | 회원가입 (3단계) |

## 알려진 단순화

- 지도는 `MapView` 컴포넌트에 pin 목록을 넘기는 형태로 분리되어 있어, 실제 Kakao/Naver Map SDK 연동 시 내부 구현만 교체하면 됩니다.
- 브랜드 로고 이미지 파일이 없어 헤더는 이니셜 마크로 대체했습니다.
- 회원가입/로그인의 중복확인·인증요청·주소검색은 백엔드가 없어 클릭 시 성공 상태만 흉내 냅니다.
