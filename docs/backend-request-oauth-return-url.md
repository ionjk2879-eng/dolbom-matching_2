# 백엔드 요청: OAuth 로그인 후 돌아갈 프론트 주소 선택

작성: 프론트엔드 (2026-10-08)
대상: `backend/src/routes/auth.ts`

## 배경

카카오/네이버 로그인이 끝나면 백엔드는 항상 `c.env.FRONTEND_URL`로 돌려보냅니다.

- `backend/src/routes/auth.ts` 75행, 141행: `const frontendUrl = c.env.FRONTEND_URL`
- 배포 백엔드의 값: `backend/wrangler.toml` 7행 `FRONTEND_URL = "https://dolbom-matching-2.pages.dev"`

프론트 개발자는 보통 로컬 프론트(`http://localhost:5173`)를 **배포 백엔드**에 붙여서 작업합니다(`frontend/.env`의 `VITE_API_URL`). 이렇게 하면 로컬에서 로그인 버튼을 눌러도 로그인이 끝난 뒤 배포 사이트로 넘어가기 때문에, **로컬에서는 로그인이 되지 않습니다.** 로그인이 필요한 화면(일정 등록, 공백 캘린더 등)은 배포하기 전까지 로컬에서 확인할 수 없습니다.

지금은 콜백 주소 `https://dolbom-matching-2.pages.dev/auth/callback?token=...`의 도메인을 손으로 `http://localhost:5173`으로 바꿔서 우회하고 있습니다. 번거롭고, 토큰이 든 주소를 직접 다뤄야 합니다.

참고로 CORS는 이미 두 주소를 모두 허용하고 있습니다(`backend/src/index.ts` 14행: `[c.env.FRONTEND_URL, 'http://localhost:5173']`).

## 요청 내용

로그인을 시작할 때 프론트가 돌아올 주소를 알려 주면, 그 주소가 **허용 목록에 있을 때만** 그 주소로 돌려보내 주세요.

### 1. 시작 라우트에 `return_to` 파라미터 추가

```
GET /auth/kakao?return_to=http://localhost:5173
GET /auth/naver?return_to=http://localhost:5173
```

- `return_to`는 **origin만** 받습니다(스킴 + 호스트 + 포트, 경로 없음).
- 허용 목록: CORS와 같은 `[c.env.FRONTEND_URL, 'http://localhost:5173']`
- 목록에 없거나 값이 없으면 지금처럼 `FRONTEND_URL`을 씁니다.

### 2. `return_to`를 서명된 `state`에 함께 넣기

콜백(`/auth/kakao/callback`, `/auth/naver/callback`)에서는 쿼리를 믿을 수 없으므로, 시작할 때 고른 주소를 `signState()`로 만드는 `state` 안에 넣고 서명해 주세요. 콜백에서는 `verifyState()`로 검증한 뒤 그 값을 꺼내 씁니다.

- 성공: `${returnTo}/auth/callback?token=...`
- 실패(`invalid_state` 등): `${returnTo}/login?error=...`. 단, state 검증에 실패하면 값을 믿을 수 없으므로 `FRONTEND_URL`로 보냅니다.

### 보안상 꼭 지켜야 할 점

- **허용 목록 검사는 반드시 해 주세요.** 아무 주소나 받으면 공격자가 `return_to=https://evil.example`을 넣어 로그인 토큰을 가로챌 수 있습니다(open redirect).
- 비교는 정확히 일치(`===`)로 합니다. `startsWith`로 비교하면 `http://localhost:5173.evil.example` 같은 주소가 통과합니다.

## 프론트 쪽 변경 (백엔드 반영 후 프론트에서 처리)

`frontend/src/pages/Login.tsx` 33·39행의 로그인 링크에 `?return_to=${window.location.origin}`만 붙이면 됩니다. 백엔드가 이 파라미터를 무시하는 동안에도 아무 영향이 없으므로, 순서와 상관없이 먼저 넣어 둘 수 있습니다.

`AuthCallbackPage`는 로그인 버튼을 누른 탭에서만 토큰을 받는 검사를 이미 하고 있어서, 따로 바꿀 것은 없습니다.

## 확인 방법

1. 로컬 프론트(`localhost:5173`, 배포 백엔드에 연결)에서 카카오로 로그인 → `http://localhost:5173/auth/callback?token=...`으로 돌아오고 로그인됨
2. 배포 사이트에서 로그인 → 지금처럼 배포 사이트로 돌아옴
3. `return_to=https://evil.example`로 시작 → `FRONTEND_URL`로 돌아옴
4. `return_to` 없이 시작 → `FRONTEND_URL`로 돌아옴 (지금과 동일)

## 대안 (백엔드 수정 없이)

프론트 개발자가 백엔드도 로컬에서 띄우는 방법이 있습니다(`backend/.dev.vars`의 `FRONTEND_URL=http://localhost:5173`, `frontend/.env`의 `VITE_API_URL=http://localhost:8787`). 다만 로컬 Postgres와 카카오/네이버 개발자 콘솔에 로컬 콜백 URL 등록이 필요해서, 프론트만 작업하는 사람에게는 부담이 큽니다.
