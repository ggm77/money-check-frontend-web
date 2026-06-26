# AssetView

오픈뱅킹 계좌와 잔액을 조회하는 프론트엔드입니다.

## 실행

```bash
npm run dev
```

기본 API 서버는 `https://money.seohamin.com`입니다. 개발 서버는 `/api`
요청을 `https://money.seohamin.com`으로 프록시하고, 운영 빌드는 기본적으로
`https://money.seohamin.com/api/v1`을 호출합니다.

## API 서버 설정

환경별로 서버 주소를 바꾸려면 `.env.local` 또는 배포 환경변수에 아래 값을
설정합니다.

```bash
# API base URL 전체를 직접 지정
VITE_API_BASE_URL=https://money.seohamin.com/api/v1

# 또는 서버 origin과 API prefix를 분리해서 지정
VITE_API_SERVER_URL=https://money.seohamin.com
VITE_API_PREFIX=/api/v1
```

로컬 개발에서 Vite 프록시를 계속 쓰려면 `VITE_API_BASE_URL`은 `/api/v1`로
두고 프록시 대상만 바꿉니다.

```bash
VITE_API_BASE_URL=/api/v1
VITE_API_PROXY_TARGET=https://money.seohamin.com
```

## 연동 API

- 회원가입 및 로그인
- 오픈뱅킹 인증 URL 발급
- 연결 계좌 목록 조회
- 계좌별 잔액 조회

JWT accessToken은 로그인 상태 유지 선택 시 `localStorage`, 선택하지 않으면
`sessionStorage`에 저장됩니다.
