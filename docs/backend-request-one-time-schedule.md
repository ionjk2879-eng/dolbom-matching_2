# 백엔드 요청: "이번 한 번만" 일정 (반복하지 않는 일정)

작성: 프론트엔드
대상: `backend/src/db/schema.sql`, `backend/src/db/schedules.ts`, `backend/src/routes/schedules.ts`

## 배경

지금은 모든 일정이 매주 반복입니다. `schedules` 테이블에 요일(`days_of_week`)만 있고 날짜 칸이 없어서 "이번 주 목요일만" 같은 일정을 저장할 수 없습니다.

사용자가 일정을 추가할 때 "다음 주에도 적용되는지"를 직접 고를 수 있게, 일정 등록 화면(`/calendar/new`)에 **매주 반복** 체크박스를 넣었습니다. 끄면 날짜 하나를 고르고, 그 날짜에만 적용되는 일정이 됩니다.

프론트는 이미 아래 API 형식으로 요청을 보내고 있습니다. 백엔드가 `schedule_date`를 저장하지 않으면 프론트가 방금 만든 일정을 지우고 "서버가 아직 지원하지 않아요" 오류를 보여 줍니다. 그래서 백엔드 반영 전까지는 반복 끄기 옵션으로 저장할 수 없습니다.

## 요청 내용

### 1. 컬럼 추가

```sql
ALTER TABLE schedules ADD COLUMN schedule_date DATE;
```

- `NULL` = 지금처럼 매주 반복 (기존 데이터는 모두 `NULL` → 동작 변화 없음)
- 값이 있음 = 그 날짜 하루만의 일정
- `schema.sql`에도 반영하고, `db/migrations/`에 마이그레이션 파일을 추가해 주세요.

### 2. `POST /schedules`, `PATCH /schedules/:id`

요청 body에 `schedule_date`를 받아 주세요.

```json
{
  "child_id": null,
  "type": "parent_work",
  "days_of_week": [4],
  "start_time": "09:00",
  "end_time": "18:00",
  "schedule_date": "2026-10-15"
}
```

- 형식: `'YYYY-MM-DD'` 문자열 또는 `null`
- 프론트는 POST와 PATCH 모두 **항상** `schedule_date`를 보냅니다. 반복 일정이면 `null`입니다.
- PATCH에서 `null`이 오면 반복 일정으로 되돌리는 뜻이니 컬럼을 `NULL`로 바꿔 주세요. (`child_id`처럼 `'schedule_date' in body`로 판단)
- 프론트는 `schedule_date`가 있을 때 `days_of_week`에 그 날짜의 요일 하나만 넣어 보냅니다. 백엔드에서 따로 검증하지 않아도 되지만, 하신다면 "요일이 날짜와 맞지 않으면 400" 정도면 충분합니다.
- 잘못된 날짜 문자열은 400으로 돌려 주세요.

### 3. 응답

`GET /schedules`, `POST`, `PATCH` 응답 항목에 `schedule_date`를 포함해 주세요. 지금 `RETURNING *`, `SELECT *`를 쓰고 있어서 컬럼만 추가하면 자동으로 들어갑니다.

```json
{
  "id": "uuid",
  "days_of_week": [4],
  "start_time": "09:00:00",
  "end_time": "18:00:00",
  "schedule_date": "2026-10-15"
}
```

- `DATE`가 ISO 타임스탬프(`2026-10-15T00:00:00.000Z`)로 직렬화돼도 프론트가 앞 10글자만 쓰므로 괜찮습니다.
- **프론트는 응답에 `schedule_date` 값이 있는지로 "백엔드가 지원하는지"를 판단합니다.** 저장했으면 반드시 응답에 담아 주세요.

### 4. 공백 계산 라우트 (해당 시)

`backend/src/routes/gaps.ts`와 `db/schedules.ts` 60행 근처 쿼리처럼 날짜별로 일정을 고르는 곳이 있다면, `schedule_date IS NOT NULL`인 일정은 그 날짜에만 포함되도록 조건을 추가해 주세요.

```sql
WHERE (s.schedule_date IS NULL AND ${dow} = ANY(s.days_of_week))
   OR  s.schedule_date = ${date}
```

## 프론트엔드 쪽 (이미 반영됨)

- `frontend/src/pages/ScheduleNew.tsx`: 매주 반복 체크박스, 끄면 날짜 입력
- `frontend/src/store/careScheduleStore.ts`: `schedule_date` 전송·수신, 미지원 서버 감지 시 되돌림
- `frontend/src/data/gaps.ts` `occursOn()`: 반복 안 하는 일정은 그 날짜에만 공백 계산·달력에 반영
- 주간 반복 패턴 화면(메인 주간 그리드, 공백 패턴, 돌봄 매칭)에는 반복 일정만 표시

## 완료 확인 기준

- 일정 등록에서 "매주 반복"을 끄고 날짜를 골라 등록하면 오류 없이 저장된다.
- `/calendar`에서 그 날짜에만 일정이 보이고, 다음 주 같은 요일에는 보이지 않는다.
- 기존 일정(`schedule_date = NULL`)은 지금처럼 매주 보인다.
- 반복 안 하는 일정을 수정 화면에서 "매주 반복"으로 바꾸면 `schedule_date`가 `NULL`이 된다.
