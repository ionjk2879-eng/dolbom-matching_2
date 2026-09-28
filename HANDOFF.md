# 인수인계 문서

## 현재 브랜치
- 작업 브랜치: `backend-juhyun`
- 배포 브랜치: `main`

---

## 완료된 작업

### 환경 설정
- React + Vite (TypeScript) 프론트엔드 — `frontend/`
- Hono + Cloudflare Workers (TypeScript) 백엔드 — `backend/`
- PostgreSQL 17 로컬 설치 (Windows)
- pgAdmin으로 DB/유저 생성 (`dolbom` / `dolbom`)

### 배포
- **프론트엔드**: Cloudflare Pages 자동 배포 → `dolbom-matching-2.pages.dev`
- **백엔드**: Cloudflare Workers 자동 배포 → `dolbom-matching-2.ionjk2879.workers.dev`
- main 브랜치 push 시 자동 배포

### DB 스키마 (`backend/src/db/schema.sql`)
생성된 테이블 5개:
- `users` — 부모 계정
- `children` — 아이 정보 (학년, 이동시간)
- `schedules` — 아이/부모 반복 주간 일정
- `schedule_exceptions` — 특정 날짜 예외 일정
- `care_providers` — 돌봄 기관 정보

### 백엔드 연결
- `backend/src/db/index.ts` — postgres.js DB 연결 함수
- `backend/src/index.ts` — Hono 앱 (DB 연결 포함)
- `/health` 엔드포인트로 DB 연결 확인 완료

### 로컬 실행
```bash
# 루트에서 한 번에 실행
npm run dev   # 프론트: 5173 / 백엔드: 8787 (wrangler dev)
```

### 환경변수
- `backend/.dev.vars` — 로컬 wrangler dev용 (git 제외)
- `backend/.env` — postgres.js 연결용 (git 제외)
- `.env.example` 참고

---

## 다음 할 일

### 우선순위 1 — 팀원 인증 API 확인
- 팀원(프론트 브랜치: `frontend`)이 인증 API 작업 중
- main pull 후 인증 API 있으면 일정 API와 연결

### 우선순위 2 — 일정 관리 API 개발
인증 API 완료 후 아래 엔드포인트 구현:
- `POST /schedules` — 기본 반복 일정 등록
- `GET /schedules` — 내 일정 조회
- `PATCH /schedules/:id` — 일정 수정
- `DELETE /schedules/:id` — 일정 삭제
- `POST /schedules/:id/exceptions` — 특정 날짜 예외 처리

### 우선순위 3 — 돌봄 공백 계산 API
- `GET /gaps?date=` — 날짜별 돌봄 공백 자동 계산
- `GET /care-options` — 공백에 맞는 돌봄 기관 탐색

---

## 팀원 브랜치 현황
| 브랜치 | 담당 | 상태 |
|--------|------|------|
| `backend-juhyun` | 주현 (백엔드) | 작업 중 |
| `frontend` | 팀원 | 작업 시작 |
