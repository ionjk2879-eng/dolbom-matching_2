# 인수인계 문서

> 마지막 업데이트: 2026-10-02

## 현재 브랜치
- 작업 브랜치: `main`
- 상태: 기능 구현 진행 중, main에 자동 배포

---

## 프로젝트 핵심 방향

> **"아이와 부모의 반복 주간 일정을 한 번 등록하면, 돌봄 공백을 자동으로 계산하고 공백에 맞는 돌봄 기관을 비교·조합할 수 있도록 돕는 서비스"**

```
① 아이/부모 반복 주간 패턴 등록 (한 번만)
② 시스템이 공백 자동 계산 (하교시간 + 통학 → 귀가, 퇴근 시간 비교)
③ 공백 시간대에 맞는 돌봄 기관 탐색·비교
④ 사용자가 선택/조합
```

---

## 백엔드 API

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/auth/kakao` | 카카오 OAuth 로그인 |
| GET | `/auth/naver` | 네이버 OAuth 로그인 |
| GET | `/auth/me` | 현재 유저 정보 (Bearer JWT) |
| POST | `/auth/logout` | 로그아웃 |
| POST | `/auth/register` | ID/PW 회원가입 |
| POST | `/auth/login` | ID/PW 로그인 |
| GET | `/auth/check-id` | 아이디 중복 확인 |
| GET/POST/PATCH/DELETE | `/children` | 아이 정보 CRUD |
| GET/POST/PATCH/DELETE | `/schedules` | 반복 주간 일정 CRUD |
| POST | `/schedules/:id/exceptions` | 특정 날짜 예외 처리 |
| GET | `/gaps?date=YYYY-MM-DD` | 날짜별 돌봄 공백 자동 계산 |
| GET | `/care-options?start=&end=&grade=` | 공백에 맞는 돌봄 기관 탐색 |

### 백엔드 파일 구조
```
backend/src/
├── db/
│   ├── index.ts          # postgres.js 연결 (neon 드라이버 → postgres.js 교체됨)
│   ├── users.ts          # upsertUser, findUserById
│   ├── children.ts       # children CRUD
│   ├── schedules.ts      # schedules CRUD + getActiveSchedulesForDate
│   └── care_providers.ts # findCareProviders
├── middleware/
│   └── auth.ts           # requireAuth (JWT Bearer 검증)
├── routes/
│   ├── auth.ts           # OAuth + ID/PW + /me + /logout
│   ├── children.ts       # /children
│   ├── schedules.ts      # /schedules
│   └── gaps.ts           # /gaps + /care-options
├── index.ts              # 앱 진입점, 라우트 등록
└── types.ts              # Env, User 타입
```

### DB 스키마 (`backend/src/db/schema.sql`)
- `users` — OAuth/로컬 계정 (provider: kakao/naver/local, login_id, password_hash)
- `children` — 아이 정보 (user_id FK, grade 1-6, commute_minutes)
- `schedules` — 반복 주간 패턴 (type: child_school/parent_work/care, days_of_week int[])
- `schedule_exceptions` — 특정 날짜 예외
- `care_providers` — 돌봄 기관 정보 (현재 실데이터 없음 → demo 3개 fallback)

---

## 프론트엔드 구조

### 주요 파일
```
frontend/src/
├── api/
│   ├── careOptions.ts     # /care-options 연결, demo fallback 포함
│   ├── children.ts        # /children CRUD (PATCH 포함)
│   ├── schedules.ts       # /schedules CRUD
│   └── client.ts          # apiFetch 베이스 클라이언트
├── components/
│   ├── CareScheduleEditor.tsx  # 아이 등록 + 부모/아이 일정 캘린더 + 거주지 입력 (공용)
│   ├── WeekScheduleGrid.tsx    # 드래그 인터랙티브 주간 캘린더
│   ├── GapWeekGrid.tsx         # 공백 패턴 읽기 전용 주간 뷰
│   └── GapMatchPanel.tsx       # 공백 기반 돌봄 옵션 선택 패널
├── data/
│   ├── gaps.ts            # computeGaps 로컬 계산 함수 (교집합 기반 맞벌이 지원)
│   ├── careMatch.ts       # 필터링 함수 + REGIONS 상수
│   ├── districts.ts       # 시/도 → 구/군 목록 (전국 17개 시/도)
│   ├── scheduleLabel.ts   # blockLabel() — 일정 블록 표시 이름 결정 (parentLabel 반영)
│   └── types.ts           # RecurringSchedule, Child, CareOption 등
├── pages/
│   ├── Home.tsx           # 메인 (일정 등록 + 맞춤 매칭)
│   └── Find.tsx           # 돌봄 찾기 (지도 + 필터)
└── store/
    ├── careScheduleStore.ts  # 아이/일정 상태 (API 연동, useParentTags 포함)
    └── matchStore.ts         # 매칭 필터 상태 (grade/time/region/district/costFilter)
```

### 핵심 데이터 모델

**RecurringSchedule**
```ts
{
  id: string
  childId: string | null   // null = 부모 일정
  type: 'child_school' | 'parent_work' | 'care'
  daysOfWeek: number[]
  startTime: string        // 'HH:mm'
  endTime: string          // 'HH:mm'
  careOptionId?: string    // type=care 일 때 연결된 돌봄 기관 ID
  title?: string           // 사용자 지정 이름 (localStorage 태그)
  memo?: string            // 메모 (localStorage 태그)
  parentLabel?: 'mom' | 'dad'  // parent_work 일 때 엄마/아빠 구분 (localStorage 태그)
}
```

**주의**: `careOptionId`, `title`, `memo`, `parentLabel` 모두 DB에 없는 필드로 각각 localStorage persist 스토어에 보관.  
`useParentTags` (`parent-tags` 키), `useScheduleNotes` (`schedule-notes` 키), `useCareOptionTags` (`care-option-tags` 키).  
업데이트/삭제 시 반드시 이 필드들을 함께 유지해야 탭 필터·이름 표시가 깨지지 않음 (parentLabel 버그 한 번 발생했음).

### 공백 계산 로직 (`data/gaps.ts`)
- 한 부모: `gap = parent_work - child_covered`
- 맞벌이 (엄마+아빠 둘 다 등록): `gap = intersect(mom_work, dad_work) - child_covered`
- `child_covered` = 학교 + 돌봄(care) 일정 + 통학 버퍼

---

## 기능 현황 (2026-10-02 기준)

### 완료된 기능

| 기능 | 위치 | 설명 |
|------|------|------|
| 아이 등록/수정/삭제 | CareScheduleEditor | 이름·학년·통학시간, 인라인 수정 폼 |
| 엄마/아빠 근무 분리 | CareScheduleEditor | 각 탭 독립 저장, 서로 다른 색상 (검정/주황) |
| 아이 학교 일정 | CareScheduleEditor | 아이별 탭, care 타입도 함께 표시 |
| 공백 패턴 뷰 | CareScheduleEditor > 공백 패턴 탭 | 주간 공백 시각화, 스크롤 없이 전체 표시 |
| 거주지 입력 | CareScheduleEditor | 시/도 + 구/군 드롭다운, matchStore에 저장 |
| 맞춤 매칭 | Home.tsx | 모든 아이의 공백 각각 표시, 돌봄 조합 체크 |
| 위치 기반 필터링 | Home + Find | 시/도 + 구/군 선택, 전국 17개 시/도 데이터 |
| 유료/무료 필터 | Home + Find | 전체/무료/유료 칩 필터 |
| 돌봄 옵션 주소 표시 | GapMatchPanel | 실제 주소 노출 |
| 드래그 캘린더 | WeekScheduleGrid | 생성·이동·리사이즈·펀치·다중선택 |
| 블록 리사이즈 버그 수정 | WeekScheduleGrid | parentLabel 유실로 블록 사라지는 현상 수정 |

### 미완료 / 추가 필요

| 항목 | 설명 |
|------|------|
| care_providers 실데이터 | DB에 실제 돌봄 기관 데이터 삽입 필요. 현재 demo 3개만 표시 |
| 네이버 지도 API | Find 페이지 지도 표시 (Client ID 발급 필요) |
| schedule_exceptions 조회/삭제 | 현재 POST만 구현, GET/DELETE 없음 |
| 운영 DB 스키마 적용 | 운영 PostgreSQL에 schema.sql 미적용 상태 |
| 맞벌이 공백 UX 설명 | 교집합 계산으로 바뀌었는데 사용자에게 안내 텍스트 없음 |
| 동 레벨 필터 | 현재 구/군까지만 드롭다운, 동 레벨은 미구현 |

---

## 환경 설정

### 로컬 실행
```bash
# 프론트 (frontend/)
npm run dev   # 포트 5173

# 백엔드 (backend/)
npx wrangler dev   # 포트 8787
```

### 환경변수 파일들
- `backend/.dev.vars` — 로컬 백엔드 환경변수 (git 제외)
  ```
  DATABASE_URL=postgresql://dolbom:dolbom@localhost:5432/dolbom
  JWT_SECRET=<랜덤 문자열>
  KAKAO_CLIENT_ID=<developers.kakao.com>
  KAKAO_CLIENT_SECRET=<developers.kakao.com>
  NAVER_CLIENT_ID=<developers.naver.com>
  NAVER_CLIENT_SECRET=<developers.naver.com>
  FRONTEND_URL=http://localhost:5173
  ```
- `frontend/.env` — 로컬 프론트 환경변수 (git 제외)
  ```
  VITE_API_URL=http://localhost:8787
  ```
- `frontend/.env.production` — 프로덕션 (git 포함)
  ```
  VITE_API_URL=https://dolbom-matching-backend.dolbommatchj.workers.dev
  ```

### OAuth 콜백 URL
- 카카오: `http://localhost:8787/auth/kakao/callback`
- 네이버: `http://localhost:8787/auth/naver/callback`

### 로컬 DB
- host: localhost, db: dolbom, user: dolbom, password: dolbom, port: 5432
- pgAdmin에서 관리
- 스키마 적용: pgAdmin Query Tool → `backend/src/db/schema.sql` 실행

---

## 배포
- Frontend: Cloudflare Pages → `dolbom-matching-2.pages.dev`
- Backend: Cloudflare Workers → `dolbom-matching-backend.dolbommatchj.workers.dev`
- **main 브랜치 push 시 자동 배포**

## 알려진 주의사항
- `backend/` 에서 `npm install` 필요 (처음 클론 시)
- care_providers 테이블 데이터 없음 → /care-options 항상 demo 3개 반환
- 포트 충돌 시: `Get-Process -Name "node" | Stop-Process -Force` 후 재실행
- localStorage 키: `match` (matchStore), `parent-tags` (useParentTags), `care-option-tags` (useCareOptionTags), `schedule-notes` (useScheduleNotes)
- 재로그인 필요 상황: JWT_SECRET 변경 시 기존 토큰 무효 → 브라우저에서 재로그인
