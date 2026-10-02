# 진행 상황 (작업 로그)

> CLAUDE.md는 `.gitignore`에 등록되어 로컬에만 있습니다. 팀이 함께 보는 작업 로그는 이 파일에 둡니다.

## 방향 결정

- 처음엔 `frontend` 브랜치에 만들어져 있던 "돌봄기관 검색/요청/상담 마켓플레이스"(센터 찾기, 돌봄 요청, 문화·행사, 양육정보, 상담 신청 등)가 메인이었음.
- 실제 백엔드 스키마(`users`/`children`/`schedules`/`schedule_exceptions`/`care_providers`)와 "핵심 흐름" 비전에 맞춰, **마켓플레이스 페이지를 전부 제거**하고 **캘린더 중심 돌봄 공백 계산**으로 구조를 바꿈.
- 제거: `CenterDetail`, `ConsultNew`, `Consults`, `Events`, `Guide`, `Info`, `Request` 페이지와 관련 store/data, `SeatBadge`/`Calendar`/`PlaceholderImage` 컴포넌트.
- 인증도 정리: 아이디/비밀번호 로그인·회원가입을 없애고 **카카오/네이버 OAuth만** 사용 (부모는 간편로그인만 쓰면 되고, 센터 운영자는 스키마상 계정 소유 개념이 없어서 자체 가입 플로우가 애초에 의미 없음).

## 핵심 기능 (메인페이지 `/`에 전부 있음)

- **반복 일정 등록** (왼쪽) — `components/CareScheduleEditor.tsx` + `components/WeekScheduleGrid.tsx`: 주간 캘린더에서 빈 칸을 드래그하면 "부모 근무"/"아이 학교" 반복 일정이 즉시 등록됨. 부모·아이별로 색깔 구분해서 한 캘린더에 같이 보여줘서 공백이 눈으로 보임. 등록된 블록을 클릭하면 삭제 대신 **시간 수정 폼**(`ScheduleEditForm`, 같은 파일)이 열림 — 시작/끝 시간 변경 또는 삭제.
- **돌봄 공백 계산** — `data/gaps.ts`의 `computeGaps()`: 부모 근무시간에서 아이의 학교시간(+통학시간)을 뺀 나머지. 비전 예시(학교 09-15시+통학20분, 근무 09-18:30 → 공백 15:20-18:30)로 직접 검증함.
- **맞춤 매칭** (오른쪽) — `components/GapMatchPanel.tsx`: 오늘의 공백과 겹치는 돌봄 옵션을 보여주고, 체크박스로 조합 선택 → 선택 즉시 `type: 'care'` 반복 일정으로 저장되어 이후 공백 계산에서 자동으로 빠짐(= 커버된 시간으로 인식). 공백 커버 현황을 막대로 보여주고, **공백 커버순/가까운순**(`data/geo.ts`, 브라우저 geolocation) 정렬을 고를 수 있음.
- **특정 날짜만 취소** — `/gaps` 공백 캘린더에서 날짜를 고르면 그 요일의 반복 일정 목록이 뜨고, "이 날만 취소"로 `schedule_exceptions`에 저장됨(되돌리기 가능). 시간만 바꾸는 예외(그 날만 다른 시간)는 아직 UI 없음.
- 전용 페이지: `/gaps`(월간 공백 캘린더), `/gaps/setup`(등록 전용 페이지, 메인과 동일한 컴포넌트 재사용). `/gaps`·`/calendar`는 공용 `components/MonthCalendar.tsx`(오늘 표시, 날짜별 배지)를 같이 씀.

## 백엔드 연동

- 백엔드에 실제 `/children`, `/schedules`, `/gaps`, `/care-providers`, `/auth/register`·`/auth/login`(아이디/비번, 지금은 프론트에서 미사용) 라우트가 생겼음.
- 프론트 `store/careScheduleStore.ts`가 로컬 mock에서 **실제 API 연동**으로 바뀜 (children/schedules는 실제 DB에 저장됨). snake_case(백엔드) ↔ camelCase(프론트) 변환은 store 내부에서 처리. 예외 일정(`schedule_exceptions`)도 GET/POST/DELETE로 서버에 영구 저장됨(`api/schedules.ts`) — 새로고침해도 유지.
- `/care-options`는 "구간을 완전히 커버하는 옵션만" 찾아주는 API라, 부분적으로만 겹치는 옵션(조합용)을 놓칠 수 있음 — 공백 안을 30분 간격으로 순간 질의해서 합치는 임시 방편을 씀 (`api/careOptions.ts`에 `ponytail:` 주석으로 표시). 나중에 overlap 전용 파라미터가 생기면 교체 필요.
- 돌봄 찾기(`/find`)의 `fetchCareOptions()`는 시간·학년 조건 없는 전체 목록 API가 없어서, "00:00~23:59 커버하는 곳"만 조회 중 — 하루 종일 운영하는 기관만 남는 버그. `/care-options/all` 같은 전체 목록 API를 백엔드에 요청해둠.
- 지도는 Naver Maps JavaScript API v3로 실제 연동됨 (`components/MapView.tsx`). Client ID는 `ncpKeyId` 파라미터 사용, 인증 실패 시 `window.navermap_authFailure` 콜백으로 화면에 표시됨.
- 예전에 있던 "단발 이벤트" 일정 시스템(`scheduleStore.ts`)은 팀원이 `careScheduleStore`로 완전히 통합함 (`Schedule.tsx`/`ScheduleNew.tsx`/`MyPage.tsx`).
- 지역아동센터 77곳(대전)이 공공데이터 **시드 스크립트**(`backend/scripts/seed-community-care.ts`)로 DB에 들어감 — 실시간 공공API 호출이 아니라 JSON을 한 번 넣는 방식. 공공데이터에 운영시간이 없어 전부 **14:00~19:00 고정값**으로 들어가 있음.

## 디자인 고도화

- 메인 페이지: 히어로에 3단계 흐름 카드, 섹션 제목에 단계 번호, 좌우 레이아웃을 1024px 이상에서만 분리(그 아래는 세로로 쌓임).
- 돌봄기관 상세(`/find/:id`)에 요약 한 줄(유형·운영시간·비용) 추가.
- 사이트 로고(`src/assets/logo.png`)와 파비콘(`public/favicon.ico`, `favicon.png`, `apple-touch-icon.png`)을 브랜드 아트워크로 교체 — 헤더는 로고 이미지, 파비콘은 불투명 배경 유지(사이즈 크게).

## 알려진 제약/다음 할 일

- 로컬 개발 시 `backend/.dev.vars`(DATABASE_URL, JWT_SECRET 등)가 각자 필요함 — 커밋 안 되는 파일이라 `.dev.vars.example` 보고 직접 채워야 함.
- `/care-options`의 부분 겹침 근사 로직은 완벽하지 않음(30분보다 짧게만 여는 옵션은 놓칠 수 있음) — 백엔드에 overlap 파라미터 추가를 요청할지 검토 필요.
- 돌봄 찾기(`/find`) 전체 목록 API(`/care-options/all` 등) 백엔드 작업 대기 중.
- 배포 환경 카카오/네이버 로그인이 아직 검증 안 됨 — 백엔드 주소가 여러 번 바뀌어서 Redirect URI/`FRONTEND_URL` 설정 확인 필요.
- 이 날만 시간 변경(취소 말고), 반복 일정 요일 수정 UI는 아직 없음(요청 시 추가).
