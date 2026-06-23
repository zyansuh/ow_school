# OW School | 평화로운 게임마을

Next.js(App Router) 기반 게임 멘토링 클래스 플랫폼

**배포 URL**: https://ow-school.vercel.app

## 기술 스택

- **Frontend/Backend**: Next.js 15 · TypeScript · App Router
- **Auth**: NextAuth.js · Discord OAuth2
- **DB**: Prisma · PostgreSQL (Vercel/Neon 권장)
- **UI**: Tailwind CSS · 다크모드

## 폴더 구조

```
peaceful_game/
├── assets/                  # 원본 에셋
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/images/
└── src/
    ├── app/                 # 페이지 · API Routes
    ├── components/
    └── lib/
```

## 로컬 개발

### 1. 환경 변수

```bash
cp .env.example .env
```

| 변수 | 설명 |
|------|------|
| `DATABASE_URL` | PostgreSQL 연결 문자열 |
| `AUTH_SECRET` | NextAuth JWT 암호화용 랜덤 문자열 |
| `DISCORD_CLIENT_ID` | Discord OAuth 앱 ID |
| `DISCORD_CLIENT_SECRET` | Discord OAuth 시크릿 |
| `NEXTAUTH_URL` | `http://localhost:3000` |

Discord Developer Portal Redirect URI:

- 로컬: `http://localhost:3000/api/auth/callback/discord`
- 프로덕션: `https://ow-school.vercel.app/api/auth/callback/discord`

### 2. 설치 및 DB

```bash
npm install
npm run db:setup
```

### 3. 실행

```bash
npm run dev
```

## Vercel 배포

1. [Neon](https://neon.tech) 또는 Vercel Postgres로 DB 생성
2. Vercel 프로젝트 환경 변수 설정:
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `DISCORD_CLIENT_ID`
   - `DISCORD_CLIENT_SECRET`
   - `NEXTAUTH_URL` = `https://ow-school.vercel.app`
3. 배포 후 한 번 실행 (Vercel Shell 또는 로컬에서 프로덕션 URL로):

```bash
npm run db:setup
```

4. Discord 개발자 포털에 프로덕션 Redirect URI 등록

## 기본 관리자

최초 Discord 로그인 시 아래 Username은 자동으로 관리자 권한이 부여됩니다.

- sweet__rain
- alpha_rein.
- skysmite
- chanta0603

## 주요 페이지

| 경로 | 설명 |
|------|------|
| `/` | 메인 (Hero, 클래스 소개, 공지) |
| `/classes/[slug]` | 반별 페이지 |
| `/teachers` | 선생님 목록 |
| `/apply` | 수강 신청 |
| `/interview` | 졸업면담 |
| `/mypage` | 마이페이지 |
| `/admin` | 관리자 대시보드 |

관리자 버튼은 우측 하단에 표시됩니다 (관리자만 보임).
