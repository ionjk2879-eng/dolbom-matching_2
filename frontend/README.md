# After School

학부모–돌봄센터 매칭 웹사이트.

## 실행 방법

```bash
npm install
npm run dev
```

`npm run build`로 프로덕션 빌드, `npx tsc -b --noEmit`으로 타입 체크, `npm run lint`로 린트를 할 수 있습니다.

백엔드 주소는 `.env`의 `VITE_API_URL`로 지정합니다 (`.env.example` 참고).

## 폴더 구조

```
src/
  api/         백엔드 API 호출 (client.ts의 apiFetch가 인증 토큰을 붙이고 401이면 로그아웃)
  components/  공통 컴포넌트 (Header, PageHero, Card, MonthCalendar, WeekScheduleGrid, GapMatchPanel, MapView 등)
  data/        타입 정의와 순수 계산 로직 (돌봄 공백 계산, 날짜·거리 유틸, 매칭 조건)
  hooks/       공용 훅
  pages/       라우트별 페이지
  store/       Zustand 스토어
                 authStore          로그인 사용자·토큰
                 careScheduleStore  아이·반복 일정·예외 일정 (백엔드 연동)
                 matchStore         메인 ↔ /find 매칭 조건 공유
                 scheduleStore      캘린더 공유 설정 (브라우저에만 저장)
```

## 라우트

| 경로 | 페이지 | 로그인 필요 |
|---|---|---|
| `/` | 메인 | |
| `/find` | 돌봄 찾기 | |
| `/find/:id` | 돌봄 기관 상세 | |
| `/centers` | 센터 찾기 (시설 목록·검색) | |
| `/consult` | 상담 (준비 중) | |
| `/login` | 로그인 (카카오·네이버) | |
| `/auth/callback` | 소셜 로그인 콜백 | |
| `/mypage` | 마이페이지 | ✓ |
| `/gaps` | 돌봄 공백 캘린더 | ✓ |
| `/gaps/setup` | 아이·일정 등록 | ✓ |
| `/calendar` | 내 일정 | ✓ |
| `/calendar/new` | 일정 추가 | ✓ |
| `/calendar/:id/edit` | 일정 수정 | ✓ |
| `/calendar/settings` | 캘린더 공유 설정 | ✓ |

## 알려진 제약

- 돌봄 기관 목록(`fetchCareOptions`)은 백엔드에 전체 목록 API가 없어 항상 예시 데이터로 대체되며, 화면에 `DemoNotice` 안내가 표시됩니다.
- 공백별 기관 조회(`fetchCareOptionsForGap`)는 공백 구간을 30분 간격으로 나눠 질의해 근사합니다.
- 캘린더 공유 설정은 백엔드 API가 없어 이 브라우저에만 저장되며, 실제 공유는 되지 않습니다.
- 지도는 Naver Maps SDK를 `MapView` 안에서 불러옵니다.
- 브랜드 로고 이미지 파일이 없어 헤더는 이니셜 마크로 대체했습니다.
