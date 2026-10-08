# 백엔드 요청: 예외 일정 일괄 조회 API

작성: 프론트엔드
대상: `backend/src/routes/schedules.ts`

## 배경

프론트엔드는 로그인 후 `loadAll()`에서 아이·반복 일정·예외 일정을 불러옵니다. 예외 일정은 일정별 라우트만 있어서, 일정 수만큼 요청이 나갑니다.

- 프론트 위치: `frontend/src/store/careScheduleStore.ts` 119행
  `Promise.all(scheduleRows.map((r) => fetchExceptions(r.id)))`
- 현재 백엔드 라우트: `GET /schedules/:id/exceptions` (일정 1개당 1회 요청)

일정이 많아질수록 로그인 직후 요청 수와 대기 시간이 함께 늘어납니다. 현재 데이터 양에서는 체감이 없지만, 일정이 늘면 느려집니다.

## 요청 내용

로그인한 사용자의 모든 일정에 대한 예외 일정을 한 번에 돌려주는 엔드포인트를 추가해 주세요.

### 엔드포인트

```
GET /schedules/exceptions
```

- 인증: 기존 `/schedules` 라우트와 같은 인증 미들웨어 사용
- 쿼리 파라미터: 없음 (로그인 사용자의 전체 예외 반환)
  - 선택 사항: `?schedule_ids=id1,id2` 로 특정 일정만 거를 수 있으면 좋지만, 필수는 아닙니다.

### 권한

- `schedules.user_id = 현재 사용자`인 일정의 예외만 반환해 주세요.
- 기존 `GET /:id/exceptions`가 하는 소유권 확인과 같은 기준입니다.

### 응답

200 OK, 배열 형태. 기존 `GET /:id/exceptions`와 항목 형식을 그대로 유지해 주세요. 프론트는 이미 이 형식을 쓰고 있습니다.

```json
[
  {
    "id": "uuid",
    "schedule_id": "uuid",
    "exception_date": "2026-10-07",
    "start_time": "15:00",
    "end_time": "17:00",
    "is_cancelled": false
  }
]
```

- 예외가 없으면 `[]`를 반환합니다.
- `schedule_id`는 반드시 포함되어야 합니다. 프론트가 일정과 예외를 연결할 때 씁니다.

### 오류

- 인증 실패: 기존 라우트와 동일
- 그 외 서버 오류: 기존 라우트와 동일한 형식 사용

## 구현 참고

- 기존 `getExceptionsBySchedule(sql, scheduleId)`와 같은 방식으로 SQL을 한 번 실행하면 됩니다.
- 예시 쿼리 (스키마 컬럼명은 실제 테이블에 맞춰 주세요):

```sql
SELECT e.*
FROM schedule_exceptions e
JOIN schedules s ON s.id = e.schedule_id
WHERE s.user_id = ${userId}
```

- 기존 일정별 라우트는 그대로 두어 주세요. 캘린더 등 다른 화면이 쓸 수 있습니다.

## 프론트엔드 후속 작업 (백엔드 배포 후)

백엔드 API가 생기면 프론트에서 다음을 바꿉니다.

1. `frontend/src/api/schedules.ts`에 `fetchAllExceptions()` 추가
2. `careScheduleStore.ts` 119행의 일정별 `Promise.all`을 `fetchAllExceptions()` 한 번 호출로 교체

## 완료 확인 기준

- 일정이 여러 개인 사용자로 로그인했을 때, 개발자 도구 네트워크 탭에서 예외 조회 요청이 1회만 나간다.
- 응답에 각 예외의 `schedule_id`가 들어 있다.
- 다른 사용자의 일정 예외는 응답에 포함되지 않는다.
- 예외가 없는 사용자는 `[]`를 받는다.
