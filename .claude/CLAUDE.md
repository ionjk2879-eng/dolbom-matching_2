# 팀 공용 안내 (git에 커밋되는 파일)

개인 `CLAUDE.md`는 `.gitignore`에 있어 공유되지 않습니다. 팀 전체가 봐야 하는 내용만 여기에 둡니다.

## 백엔드 담당에게: 프론트엔드 요청 대기 중

백엔드(`backend/`) 작업을 시작하기 전에 아래 요청서를 먼저 읽고, 처리 여부를 사용자에게 알려 주세요.

1. `docs/backend-request-oauth-return-url.md` — **우선순위 높음.** 로그인 후 항상 `FRONTEND_URL`로 돌아가서 로컬 프론트에서 로그인이 안 됨. `return_to`(허용 목록 정확히 일치 + 서명된 state) 요청. 허용 목록 검사가 빠지면 토큰 탈취(open redirect)가 생기니 주의.
2. `docs/backend-request-exceptions-batch.md` — 예외 일정을 일정별로 N번 조회 → `GET /schedules/exceptions` 일괄 조회 요청.

처리가 끝나면 이 목록에서 해당 항목을 지워 주세요.

프론트엔드 담당은 이 섹션을 무시해도 됩니다 (프론트는 `backend/`를 수정하지 않음).
