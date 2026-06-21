# AssetView

오픈뱅킹 계좌와 잔액을 조회하는 프론트엔드입니다.

## 실행

백엔드 서버를 `http://localhost:8080`에서 실행한 후:

```bash
npm run dev
```

개발 서버는 `/api` 요청을 `http://localhost:8080`으로 프록시합니다.

## 연동 API

- 회원가입 및 로그인
- 오픈뱅킹 인증 URL 발급
- 연결 계좌 목록 조회
- 계좌별 잔액 조회

JWT accessToken은 로그인 상태 유지 선택 시 `localStorage`, 선택하지 않으면
`sessionStorage`에 저장됩니다.
