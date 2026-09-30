# 인수인계 문서

> 마지막 업데이트: 2026-09-30

## 현재 브랜치
- 작업 브랜치: `main` (팀원 프론트 merge 완료)
- 배포 브랜치: `main`

---

## 프로젝트 핵심 방향 (노션 리서치 기반)

> **"아이와 부모의 반복 주간 일정을 한 번 등록하면, 돌봄 공백을 자동으로 계산하고 공백에 맞는 돌봄 기관을 비교·조합할 수 있도록 돕는 서비스"**

```
① 아이/부모 반복 주간 패턴 등록 (한 번만)
② 시스템이 공백 자동 계산 (하교시간 + 통학 → 귀가, 퇴근 시간 비교)
③ 공백 시간대에 맞는 돌봄 기관 탐색·비교
④ 사용자가 선택/조합
```

---

## 완료된 작업

### 백엔드 API (전부 구현 완료)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/auth/kakao` | 카카오 로그인 |
| GET | `/auth/naver` | 네이버 로그인 |
| GET | `/auth/me` | 현재 유저 정보 (Bearer JWT) |
| POST | `/auth/logout` | 로그아웃 |
| GET/POST/PATCH/DELETE | `/children` | 아이 정보 CRUD |
| GET/POST/PATCH/DELETE | `/schedules` | 반복 주간 일정 CRUD |
| POST | `/schedules/:id/exceptions` | 특정 날짜 예외 처리 |
| GET | `/gaps?date=YYYY-MM-DD` | 날짜별 돌봄 공백 자동 계산 |
| GET | `/care-options?start=&end=&grade=` | 공백에 맞는 돌봄 기관 탐색 |

### 백엔드 파일 구조
```
backend/src/
├── db/
│   ├── index.ts          # postgres.js 연결
│   ├── users.ts          # upsertUser, findUserById
│   ├── children.ts       # children CRUD
│   ├── schedules.ts      # schedules CRUD + getActiveSchedulesForDate
│   └── care_providers.ts # findCareProviders
├── middleware/
│   └── auth.ts           # requireAuth (JWT Bearer 검증)
├── routes/
│   ├── auth.ts           # OAuth + /me + /logout
│   ├── children.ts       # /children
│   ├── schedules.ts      # /schedules
│   └── gaps.ts           # /gaps + /care-options
├── index.ts              # 앱 진입점, 라우트 등록
└── types.ts              # Env, User 타입
```

### DB 스키마 (`backend/src/db/schema.sql`)
- `users` — OAuth 기반 (kakao/naver, UUID PK)
- `children` — 아이 정보 (user_id FK, grade, commute_minutes)
- `schedules` — 반복 주간 패턴 (type: child_school/parent_work/care, days_of_week int[])
- `schedule_exceptions` — 특정 날짜 예외
- `care_providers` — 돌봄 기관 정보

### 프론트엔드 (팀원 구현, main merge됨)
- 페이지: Home, Find, Request, Events, Info, Guide, Login, Signup
- 인증 페이지: Login, Signup, AuthCallbackPage
- 보호 라우트: MyPage, Schedule, ScheduleNew, ScheduleSettings, ConsultNew, Consults
- 상태관리: Zustand (authStore, scheduleStore, matchStore, consultStore, requestStore)
- 인증 흐름: `authStore` → `api/auth.ts` → `/auth/me` ✅

---

## 미완료 — 프론트 백엔드 연결

### 🔴 고쳐야 할 것 (타입 불일치 + 미연결)

| 파일 | 현재 문제 | 해야 할 것 |
|------|-----------|-----------|
| `store/scheduleStore.ts` | localStorage 저장, 백엔드 미사용 | 제거 → API 직접 호출 |
| `pages/ScheduleNew.tsx` | 단발 이벤트 입력 (title, date, centerId) | 반복 주간 패턴 입력으로 변경 (type, days_of_week, start_time, end_time) |
| `pages/Schedule.tsx` | localStorage 캘린더 표시 | `GET /schedules` 연결 |
| `api/centers.ts` | 하드코딩 데이터 반환 | `GET /care-options` 연결 |

**Schedule 타입 불일치:**
```ts
// 프론트 (현재) — 단발 이벤트
{ id, title, date, start, end, centerId, memo }

// 백엔드 (API) — 반복 주간 패턴
{ id, user_id, child_id, type, days_of_week, start_time, end_time }
```

### 🟡 추가해야 할 것

| 항목 | 설명 |
|------|------|
| 아이 등록 화면 | `POST /children` 연결 (학년, 통학시간 입력) |
| 공백 결과 화면 | `GET /gaps?date=` 결과 타임라인 시각화 |
| 공백→기관 연결 | 공백 클릭 → `/care-options` 탐색 화면 |
| care_providers 실데이터 | DB에 실제 돌봄 기관 데이터 삽입 필요 |

---

## 환경 설정

### 로컬 실행
```bash
npm run dev   # 루트에서 실행 (프론트 5173 / 백엔드 8787)
```

### 환경변수 (`backend/.dev.vars`, git 제외)
```
DATABASE_URL=postgresql://dolbom:dolbom@localhost:5432/dolbom
JWT_SECRET=            ← 랜덤 문자열
KAKAO_CLIENT_ID=       ← developers.kakao.com
KAKAO_CLIENT_SECRET=   ← developers.kakao.com
NAVER_CLIENT_ID=       ← developers.naver.com
NAVER_CLIENT_SECRET=   ← developers.naver.com
FRONTEND_URL=http://localhost:5173
```

> ⚠️ KAKAO/NAVER 키 미설정 시 로그인 버튼 누르면 Internal Server Error

### OAuth 콜백 URL 등록 필요
- 카카오: `http://localhost:8787/auth/kakao/callback`
- 네이버: `http://localhost:8787/auth/naver/callback`

### DB 스키마 적용
- 로컬: pgAdmin Query Tool에서 `backend/src/db/schema.sql` 실행
- 운영: 운영 DB에도 동일하게 실행 필요

---

## 배포
- Frontend: Cloudflare Pages → `dolbom-matching-2.pages.dev`
- Backend: Cloudflare Workers → `dolbom-matching-2.ionjk2879.workers.dev`
- main 브랜치 push 시 자동 배포

## 팀원 브랜치
| 브랜치 | 담당 | 상태 |
|--------|------|------|
| `main` | 통합 | 팀원 프론트 merge 완료 |
| `backend-juhyun` | 주현 (백엔드) | main에 merge됨 |
