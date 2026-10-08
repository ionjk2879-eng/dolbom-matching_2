# 인수인계 문서

> 마지막 업데이트: 2026-10-08

## 현재 브랜치
- 작업 브랜치: `main`
- 상태: 기능 구현 진행 중, main push 시 프론트 자동 배포

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
| GET | `/care-options` | 전체 돌봄 기관 (파라미터 없으면 전체 반환) |
| GET | `/care-options?start=HH:MM&end=HH:MM&grade=N` | 공백 시간·학년 필터링 |
| GET | `/care-options/:id` | 개별 돌봄 기관 상세 |

### 백엔드 파일 구조
```
backend/src/
├── db/
│   ├── index.ts          # postgres.js 연결
│   ├── users.ts          # upsertUser, findUserById
│   ├── children.ts       # children CRUD
│   ├── schedules.ts      # schedules CRUD + getActiveSchedulesForDate
│   └── care_providers.ts # findCareProviders, findAllCareProviders, findCareProviderById
├── middleware/
│   └── auth.ts           # requireAuth (JWT Bearer 검증)
├── routes/
│   ├── auth.ts           # OAuth + ID/PW + /me + /logout
│   ├── children.ts       # /children
│   ├── schedules.ts      # /schedules
│   └── gaps.ts           # /gaps + /care-options (인증 불필요)
├── index.ts              # 앱 진입점, 라우트 등록
└── types.ts              # Env, User 타입
```

### DB 스키마 (`backend/src/db/schema.sql`)
- `users` — OAuth/로컬 계정 (provider: kakao/naver/local, login_id, password_hash)
- `children` — 아이 정보 (user_id FK, grade 1-6, commute_minutes)
- `schedules` — 반복 주간 패턴 (type: child_school/parent_work/care, days_of_week int[])
- `schedule_exceptions` — 특정 날짜 예외
- `care_providers` — 돌봄 기관 정보 (**실데이터 2,237건 적재 완료**)

---

## 프론트엔드 구조

### 주요 파일
```
frontend/src/
├── api/
│   ├── careOptions.ts     # fetchCareOptions() → /care-options
│   ├── children.ts        # /children CRUD
│   ├── schedules.ts       # /schedules CRUD
│   └── client.ts          # apiFetch 베이스 클라이언트
├── components/
│   ├── CareScheduleEditor.tsx  # 아이 등록 + 일정 등록 + 공백 패턴 + 공백 캘린더 (3탭)
│   ├── WeekScheduleGrid.tsx    # 드래그 인터랙티브 주간 캘린더
│   ├── GapWeekGrid.tsx         # 공백 패턴 읽기 전용 주간 뷰
│   ├── GapMatchPanel.tsx       # 공백 기반 돌봄 옵션 체크박스 패널
│   ├── MonthCalendar.tsx       # 월간 달력 (공백 캘린더 탭에 사용)
│   └── MapView.tsx             # 네이버 지도 (핀 클릭 → 팝업, h-full 기반 크기 제어)
├── data/
│   ├── gaps.ts            # computeGaps 로컬 계산 (교집합 기반 맞벌이 지원)
│   ├── careMatch.ts       # 필터링 함수 + REGIONS 상수
│   ├── districts.ts       # 시/도 → 구/군 목록 (전국 17개 시/도)
│   ├── scheduleLabel.ts   # blockLabel() — 일정 블록 표시 이름 (parentLabel 반영)
│   └── types.ts           # RecurringSchedule, Child, CareOption 등
├── pages/
│   ├── Home.tsx           # 메인 (일정 등록 + 맞춤 매칭)
│   ├── Find.tsx           # 돌봄 찾기 (sticky 필터 + 360px 지도 + 카드 목록)
│   └── CareOptionDetail.tsx  # /find/:id 돌봄 기관 상세
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
  endTime: string
  careOptionId?: string    // type=care 일 때 연결된 돌봄 기관 ID (localStorage만)
  title?: string           // 사용자 지정 이름 (localStorage)
  memo?: string            // 메모 (localStorage)
  parentLabel?: 'mom' | 'dad'  // parent_work 일 때 엄마/아빠 구분 (localStorage)
}
```

**주의**: `careOptionId`, `title`, `memo`, `parentLabel` 모두 DB에 없는 필드.  
각각 localStorage persist 스토어에 보관:
- `useParentTags` (`parent-tags` 키)
- `useScheduleNotes` (`schedule-notes` 키)  
- `useCareOptionTags` (`care-option-tags` 키)

업데이트/삭제 시 반드시 이 필드들을 함께 유지해야 함 (parentLabel 버그 전례 있음).

### 공백 계산 로직 (`data/gaps.ts`)
- 한 부모: `gap = parent_work - child_covered`
- 맞벌이 (엄마+아빠 둘 다 등록): `gap = intersect(mom_work, dad_work) - child_covered`
- `child_covered` = 학교(+통학버퍼) + **care 타입 일정은 Home.tsx에서 제외** (아래 주의사항 참고)

### Find.tsx UX
- **일반 스크롤**: 지도는 고정되지 않고 스크롤과 함께 이동
- **sticky 필터 바**: 최상단에 항상 고정 (필터 ▼ 버튼으로 확장/축소)
- **카드 클릭**: 지도로 smooth scroll + 핀 선택
  - sticky 필터 바 높이를 `filterBarRef.offsetHeight`로 보정 (`window.scrollTo` 사용)
- **지도 팝업 "목록에서 찾기 ↓"**: 선택된 카드로 smooth scroll
- **지도 높이**: 360px (`h-[360px]`)

---

## 기능 현황 (2026-10-07 기준)

### 완료된 기능

| 기능 | 위치 | 설명 |
|------|------|------|
| 아이 등록/수정/삭제 | CareScheduleEditor | 이름·학년·통학시간, 인라인 수정 폼 |
| 엄마/아빠 근무 분리 | CareScheduleEditor | 각 탭 독립 저장, 서로 다른 색상 |
| 아이 학교 일정 | CareScheduleEditor | 아이별 탭, care 타입도 함께 표시 |
| 공백 패턴 뷰 | CareScheduleEditor > 공백 패턴 탭 | 주간 공백 시각화 |
| **공백 캘린더 탭** | CareScheduleEditor > 공백 캘린더 탭 | 월간 달력 + 날짜 선택 + 이 날만 취소/시간 변경 (MonthCalendar 사용). `/gaps`·`/gaps/setup`은 `/`로 리다이렉트 |
| 거주지 입력 | CareScheduleEditor | 시/도 + 구/군, matchStore에 저장 |
| 저장 버튼 항상 표시 | CareScheduleEditor | 변경 없을 때 disabled, 변경 시 활성화 |
| 맞춤 매칭 (체크박스) | Home.tsx + GapMatchPanel | 공백별 돌봄 옵션 선택, progress bar |
| **돌봄 센터 요일 편집** | GapMatchPanel | 이미 체크된 센터 클릭 → 즉시 삭제 대신 요일 피커 열기. 삭제 버튼 별도 추가 |
| **센터 상세 연결** | GapMatchPanel | 센터 이름 클릭 → `/find/:id` 상세 페이지 이동 |
| 돌봄 찾기 (지도) | Find.tsx + MapView | 네이버 지도 핀, 양방향 카드↔지도 이동 |
| 위치 기반 필터링 | Home + Find | 시/도 + 구/군, 전국 17개 시/도 |
| 유료/무료 필터 | Home + Find | 전체/무료/유료 칩 필터 |
| 실 데이터 연동 | Find.tsx | care_providers 2,237건 표시 |

### 미완료 / 추가 필요

| 항목 | 설명 |
|------|------|
| 네이버 지도 핀 좌표 | care_providers에 lat/lng 없는 항목이 많음 → 지도 핀 부족 |
| 운영 DB 스키마 동기화 | 운영 PostgreSQL에 최신 schema.sql 반영 확인 필요 |
| 맞벌이 공백 UX 설명 | 교집합 계산 방식 사용자 안내 없음 |
| 동 레벨 필터 | 현재 구/군까지만, 동 레벨 미구현 |
| 이 날만 시간 변경 배포 확인 | 공백 캘린더 탭에서 저장 → 공백 재계산 → 되돌리기 실제 화면 확인 필요 (계산 로직은 검증됨, PR #20) |
| 로컬 OAuth 로그인 | 콜백이 항상 `FRONTEND_URL`(배포 주소)로 돌아가서 localhost에선 로그인 불가 — 백엔드에서 돌아갈 주소 선택 필요 |

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
- **Frontend**: Cloudflare Pages → `dolbom-matching-2.pages.dev`
  - **main 브랜치 push 시 자동 배포**
- **Backend**: Cloudflare Workers → `dolbom-matching-backend.dolbommatchj.workers.dev`
  - **자동 배포 안 됨** — 백엔드 변경 후 반드시 수동 배포 필요:
    ```bash
    cd backend
    npx wrangler deploy
    ```

---

## 알려진 주의사항

- **백엔드 수동 배포**: Workers는 git push로 자동 배포되지 않음. 프론트만 자동.
- **GapMatchPanel에서 care 제외**: `Home.tsx`의 `computeGaps` 호출 시 `type === 'care'` 제외.  
  체크 시 갭이 재계산→패널 remount→체크 상태 소실되는 버그 방지용.  
  패널 안의 progress bar가 체크 커버리지를 별도 처리함.
- **GapMatchPanel 요일 피커**: `selectingOption.existingId` 유무로 신규/수정 모드 구분.  
  수정 모드에서 `takenDays`는 자기 자신(`existing.id`)을 제외하고 계산함.
- `care_providers` 좌표(lat/lng) 없는 기관 많음 → 지도 핀 적게 표시됨
- localStorage 키: `match` (matchStore), `parent-tags`, `care-option-tags`, `schedule-notes`
- 재로그인 필요 상황: JWT_SECRET 변경 시 기존 토큰 무효
- **schedule_exceptions 예외는 일정·날짜당 1개**: `computeGaps`가 첫 번째만 씀. 시간 변경은 예외 없는 일정에서만 열리고, 되돌리기로 지운 뒤 다시 설정.
- **로컬 로그인 우회**: localhost에서 로그인 → 배포 주소의 `/auth/callback?token=...`으로 넘어가면 같은 탭에서 도메인만 `http://localhost:5173`으로 바꿔 열기 (`AuthCallbackPage`는 로그인 버튼을 누른 탭에서만 토큰 수락).
- 포트 충돌 시: `Get-Process -Name "node" | Stop-Process -Force` 후 재실행

---

## 2026-10-07 변경 이력

| 항목 | 내용 |
|------|------|
| CareScheduleEditor 3탭 | 일정 등록 / 공백 패턴 / **공백 캘린더** 추가. MonthCalendar + 날짜별 공백 + "이 날만 취소" 기능 통합 |
| GapMatchPanel 체크 편집 | 체크된 센터 클릭 → 즉시 삭제 대신 요일 피커(수정 모드) 열기. 삭제 버튼 별도 추가 |
| GapMatchPanel 센터 링크 | 센터 이름 → `/find/:id` 상세 페이지 Link 추가 (stopPropagation으로 체크박스 분리) |
| Home.tsx 레이아웃 | `lg:grid-cols-[1.25fr_1fr]` → `xl:grid-cols-[2fr_1fr]` (1280px+ 2:1 비율, 일~토 7일 모두 표시) |
| 저장 버튼 항상 표시 | `isDirty` 조건부 렌더 → 항상 표시 + dirty 아닐 때 disabled |
| 공백 캘린더 일정 섹션 위치 | "이 날의 일정"을 그리드 아래 전체 너비로 이동 |
| CareScheduleEditor 폼 | 라벨-인풋 `flex items-center gap-2` 인라인 배치, 섹션 간격 조정 |
| `/gaps` 라우트 정리 | `/gaps`, `/gaps/setup` → `<Navigate to="/" replace />` redirect. `GapCalendar.tsx`, `GapSetup.tsx` 삭제. Home.tsx "공백 캘린더 전체 보기" 링크 제거 |
