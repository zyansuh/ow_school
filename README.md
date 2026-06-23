# OW School | 평화로운 게임마을

Next.js(App Router) 기반 게임 멘토링 클래스 플랫폼

## 기술 스택

- **Frontend/Backend**: Next.js 15 · TypeScript · App Router
- **Auth**: NextAuth.js · Discord OAuth2
- **DB**: Prisma · SQLite
- **UI**: Tailwind CSS · 다크모드

## 폴더 구조

```
peaceful_game/
├── assets/
│   ├── 2026-05-25/          # 원본 에셋 (배너, 마스코트, 로고)
│   ├── 2026-05-26/
│   └── images/              # 정리된 이미지
├── prisma/
│   ├── schema.prisma        # DB 스키마
│   └── seed.ts              # 시드 데이터
├── public/images/           # 웹 서빙 이미지
└── src/
    ├── app/                 # 페이지 · API Routes
    ├── components/          # UI · 레이아웃 · 관리자
    └── lib/                   # auth, prisma, rbac, constants
```

## 시작하기

### 1. 환경 변수

```bash
cp .env.example .env
```

Discord Developer Portal에서 OAuth2 앱 생성 후:

- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `NEXTAUTH_SECRET` (랜덤 문자열)

Redirect URI: `http://localhost:3000/api/auth/callback/discord`

### 2. 설치 및 DB

```bash
npm install
npm run db:setup
```

### 3. 실행

```bash
npm run dev
```

http://localhost:3000

## 기본 관리자

최초 Discord 로그인 시 아래 Username은 자동으로 관리자 권한이 부여됩니다.

- sweet__rain
- alpha_rein.
- skysmite
- chanta0603

## 주요 페이지

| 경로 | 설명 |
|------|------|
| `/` | 메인 (Hero, 클래스 소개) |
| `/classes/[slug]` | 반별 페이지 |
| `/teachers` | 선생님 목록 |
| `/teachers/[id]` | 선생님 상세 |
| `/apply` | 수강 신청 |
| `/interview` | 졸업면담 |
| `/mypage` | 마이페이지 |
| `/admin` | 관리자 대시보드 |

관리자 버튼은 우측 하단에 작게 표시됩니다 (관리자만 보임).
