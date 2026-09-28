# 돌봄 매칭

돌봄이 필요한 사람과 돌봄 제공자를 연결하는 매칭 서비스

## 배포 주소

| 구분 | URL |
|------|-----|
| 프론트엔드 | https://dolbom-matching-2.pages.dev |
| 백엔드 | https://dolbom-matching-2.ionjk2879.workers.dev |

## 기술 스택

### 프론트엔드
- React
- TypeScript
- Vite
- Cloudflare Pages

### 백엔드
- Hono
- TypeScript
- Cloudflare Workers

### 데이터베이스
- PostgreSQL

## 로컬 실행

```bash
# 의존성 설치
npm install
npm install --prefix frontend
npm install --prefix backend

# 프론트엔드 + 백엔드 동시 실행
npm run dev
```
