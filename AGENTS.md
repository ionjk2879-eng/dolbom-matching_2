# AGENTS.md — dolbom-matching

> Codex 등 Claude Code 외 AI 도구용 안내. 내용은 개인 `CLAUDE.md`(gitignore)와 같게 유지합니다. 백엔드 요청 대기 목록은 `.claude/CLAUDE.md`를 보세요.

## 기본 행동 원칙

- **모든 응답은 한국어(존댓말)로 작성합니다.**
- 코드 자체(변수명, 함수명, 파일명, 주석)는 영어를 유지합니다.
- 코드 설명, 오류 분석, 계획 공유는 모두 한국어로 합니다.

---

## 프로젝트 개요

**돌봄 매칭(After School)** — 부모와 아이의 반복 일정을 한 번 등록하면 돌봄 공백(부모가 못 돌보는 시간)을 자동으로 계산하고, 그 공백에 맞는 돌봄 옵션을 비교·조합할 수 있도록 돕는 서비스입니다.

### 핵심 흐름

1. **반복 주간 패턴 등록** (한 번만) — 아이: 학교 시간 + 통학시간, 부모: 근무 시간
2. **공백 자동 계산** — 부모 근무 시간 중 아이가 학교/돌봄으로 커버되지 않는 시간
3. **공백에 맞는 돌봄 선택지 제시** — 실제 운영시간이 공백과 겹치는 돌봄기관 후보
4. **사용자가 조합 선택** — 여러 옵션을 체크해서 공백을 채움 (선택 즉시 반복 일정으로 저장되어 다음 공백 계산에 반영됨)

### 개발 방향

- **1단계 (현재)**: 웹 서비스 우선 개발
- 모바일 앱 제작 여부는 **미정**입니다. 앱을 전제로 한 제안·설계는 하지 않습니다.

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| 프론트엔드 | React + Vite (TypeScript), Zustand, Tailwind |
| 런타임 | Node.js |
| 백엔드 | Hono (Cloudflare Workers) |
| 데이터베이스 | PostgreSQL |
| 지도 | Naver Maps JavaScript API v3 |
| 배포 | Cloudflare (Workers / Pages) |

---

## 프로젝트 구조

```
dolbom-matching/
├── frontend/        # React 앱
├── backend/         # Hono API 서버
└── AGENTS.md
```

---

## 코딩 지침

1. **최소한의 코드**: 요청한 것만 구현합니다. 추측성 기능은 추가하지 않습니다.
2. **외과적 수정**: 요청과 직접 관련된 코드만 수정합니다.
3. **검증 기준 명시**: 작업 전 "어떻게 확인할지"를 먼저 정의합니다.
4. **가정 명시**: 불확실한 부분은 숨기지 않고 바로 질문합니다.

---

## Cloudflare 배포 주의사항

- Cloudflare Workers 환경에서는 Node.js API 일부(`fs`, `path` 등)를 사용할 수 없습니다.
- Hono는 Cloudflare Workers와 호환되는 방식으로 작성합니다.
- DB 드라이버는 `postgres.js`를 씁니다 (Neon HTTP 드라이버는 로컬 Postgres에 연결 못 해서 되돌림).

---

## 주의사항

- 파괴적인 작업(`DROP TABLE`, force push 등)은 **반드시 확인 후** 실행합니다.
- 새 패키지 추가 전 기존 의존성으로 해결 가능한지 먼저 확인합니다.
- 커밋은 사용자가 명시적으로 요청할 때만 생성합니다.

---

## 진행 상황 (작업 로그)

### 방향 결정

- 처음엔 `frontend` 브랜치에 만들어져 있던 "돌봄기관 검색/요청/상담 마켓플레이스"(센터 찾기, 돌봄 요청, 문화·행사, 양육정보, 상담 신청 등)가 메인이었음.
- 실제 백엔드 스키마(`users`/`children`/`schedules`/`schedule_exceptions`/`care_providers`)와 위 "핵심 흐름" 비전에 맞춰, **마켓플레이스 페이지를 전부 제거**하고 **캘린더 중심 돌봄 공백 계산**으로 구조를 바꿈.
- 제거: `CenterDetail`, `ConsultNew`, `Consults`, `Events`, `Guide`, `Info`, `Request` 페이지와 관련 store/data, `SeatBadge`/`Calendar`/`PlaceholderImage` 컴포넌트.
- 인증도 정리: 아이디/비밀번호 로그인·회원가입을 없애고 **카카오/네이버 OAuth만** 사용 (부모는 간편로그인만 쓰면 되고, 센터 운영자는 스키마상 계정 소유 개념이 없어서 자체 가입 플로우가 애초에 의미 없음).

### 핵심 기능 (메인페이지 `/`에 전부 있음)

- **반복 일정 등록** (왼쪽) — `components/CareScheduleEditor.tsx` + `components/WeekScheduleGrid.tsx`: 주간 캘린더에서 빈 칸을 드래그하면 "부모 근무"/"아이 학교" 반복 일정이 즉시 등록됨. 부모·아이별로 색깔 구분해서 한 캘린더에 같이 보여줘서 공백이 눈으로 보임. 등록된 블록을 클릭하면 삭제 대신 **시간 수정 폼**(`ScheduleEditForm`, 같은 파일)이 열림 — 시작/끝 시간 변경 또는 삭제.
- **돌봄 공백 계산** — `data/gaps.ts`의 `computeGaps()`: 부모 근무시간에서 아이의 학교시간(+통학시간)을 뺀 나머지. 비전 예시(학교 09-15시+통학20분, 근무 09-18:30 → 공백 15:20-18:30)로 직접 검증함.
- **맞춤 매칭** (오른쪽) — `components/GapMatchPanel.tsx`: 오늘의 공백과 겹치는 돌봄 옵션을 보여주고, 체크박스로 조합 선택 → 선택 즉시 `type: 'care'` 반복 일정으로 저장되어 이후 공백 계산에서 자동으로 빠짐(= 커버된 시간으로 인식). 공백 커버 현황을 막대로 보여주고, **공백 커버순/가까운순**(`data/geo.ts`, 브라우저 geolocation) 정렬을 고를 수 있음.
- **탭 구성** — `CareScheduleEditor`가 "일정 등록 / 공백 패턴(`GapWeekGrid`) / 공백 캘린더" 탭을 가짐. 예전 `/gaps`·`/gaps/setup` 페이지는 팀원이 이 탭으로 합치고 삭제함(두 주소는 `/`로 리다이렉트).
- **특정 날짜만 취소/시간 변경** — 공백 캘린더 탭에서 날짜를 고르면 그 요일의 반복 일정 목록이 뜨고, "이 날만 취소" 또는 "시간 변경"(그 날만 다른 시작/끝 시간)으로 `schedule_exceptions`에 저장됨. "되돌리기"로 삭제. 예외는 일정·날짜당 1개만 둠(`computeGaps`도 첫 번째만 씀). 시간 변경 반영은 `computeGaps`로 검증함(13:00 하교 → 공백 13:20~18:30). PR #20.
- `/calendar`와 공백 캘린더 탭은 공용 `components/MonthCalendar.tsx`(오늘 표시, 날짜별 배지)를 같이 씀.

### 백엔드 연동

- 백엔드에 실제 `/children`, `/schedules`, `/gaps`, `/care-providers`, `/auth/register`·`/auth/login`(아이디/비번, 지금은 프론트에서 미사용) 라우트가 생겼음.
- 프론트 `store/careScheduleStore.ts`가 로컬 mock에서 **실제 API 연동**으로 바뀜 (children/schedules는 실제 DB에 저장됨). snake_case(백엔드) ↔ camelCase(프론트) 변환은 store 내부에서 처리. 예외 일정(`schedule_exceptions`)도 GET/POST/DELETE로 서버에 영구 저장됨(`api/schedules.ts`) — 새로고침해도 유지.
- `/care-options`는 "구간을 완전히 커버하는 옵션만" 찾아주는 API라, 부분적으로만 겹치는 옵션(조합용)을 놓칠 수 있음 — 공백 안을 30분 간격으로 순간 질의해서 합치는 임시 방편을 씀 (`api/careOptions.ts`에 `ponytail:` 주석으로 표시). 나중에 overlap 전용 파라미터가 생기면 교체 필요.
- 돌봄 찾기(`/find`)의 `fetchCareOptions()`는 이제 파라미터 없이 `/care-options`를 불러 전체 목록을 받음(실패 시 데모 옵션). 배포 환경에서 **2,237곳** 전체가 조회되는 것 확인함(2026-10-08).
- 지도는 Naver Maps JavaScript API v3로 실제 연동됨 (`components/MapView.tsx`). Client ID는 `ncpKeyId` 파라미터 사용, 인증 실패 시 `window.navermap_authFailure` 콜백으로 화면에 표시됨.
- 예전에 있던 "단발 이벤트" 일정 시스템(`scheduleStore.ts`)은 팀원이 `careScheduleStore`로 완전히 통합함 (`Schedule.tsx`/`ScheduleNew.tsx`/`MyPage.tsx`).
- 처음엔 지역아동센터 77곳(대전)이 공공데이터 **시드 스크립트**(`backend/scripts/seed-community-care.ts`)로 DB에 들어감 — 실시간 공공API 호출이 아니라 JSON을 한 번 넣는 방식. 공공데이터에 운영시간이 없어 전부 **14:00~19:00 고정값**으로 들어가 있음. 지금 운영 DB `care_providers`는 전국 2,237곳(어떻게 늘었는지는 HANDOFF.md 참고).

### 디자인 고도화

- 메인 페이지: 히어로에 3단계 흐름 카드, 섹션 제목에 단계 번호, 좌우 레이아웃을 1024px 이상에서만 분리(그 아래는 세로로 쌓임).
- 돌봄기관 상세(`/find/:id`)에 요약 한 줄(유형·운영시간·비용) 추가.
- 사이트 로고(`src/assets/logo.png`)와 파비콘(`public/favicon.ico`, `favicon.png`, `apple-touch-icon.png`)을 브랜드 아트워크로 교체 — 헤더는 로고 이미지, 파비콘은 불투명 배경 유지(사이즈 크게).

### 알려진 제약/다음 할 일

- 로컬 개발 시 `backend/.dev.vars`(DATABASE_URL, JWT_SECRET 등)가 각자 필요함 — 커밋 안 되는 파일이라 `.dev.vars.example` 보고 직접 채워야 함.
- `/care-options`의 부분 겹침 근사 로직은 완벽하지 않음(30분보다 짧게만 여는 옵션은 놓칠 수 있음) — 백엔드에 overlap 파라미터 추가를 요청할지 검토 필요.
- 배포 사이트 로그인은 됨. 하지만 OAuth 콜백이 항상 백엔드 `FRONTEND_URL`(배포 주소)로 돌아가서 **로컬(`localhost:5173`)에서는 로그인 불가** — 로컬 확인은 콜백 주소의 도메인을 `localhost:5173`으로 바꿔 같은 탭에서 열어야 함(`AuthCallbackPage`는 로그인 버튼을 누른 탭에서만 토큰을 받음). 백엔드에서 돌아갈 주소를 고르게 해야 근본 해결.
- 이 날만 시간 변경은 배포 화면에서 저장 → 공백 재계산 → 되돌리기까지 확인함(2026-10-08). 날짜 바뀜/빈 시간/두 번 클릭 방지는 PR #22.
- 주간 캘린더 Ctrl/Shift 다중 선택 버그(다른 요일까지 범위 선택, 겹친 블록 오선택, Ctrl+드래그로 덮어쓰기) 수정 — PR #23. Ctrl 선택은 배포에서 확인, Shift 범위·Ctrl+드래그는 화면 확인 안 함. Ctrl은 이제 선택 전용이고, 묶음 이동은 선택 후 그냥 드래그.
- `CareScheduleEditor.tsx`(~780줄), `WeekScheduleGrid.tsx`(~534줄)가 500줄 규칙 초과 — 공백 캘린더 탭/선택 로직 분리 필요.
- 반복 일정 요일 수정 UI는 아직 없음(요청 시 추가).
