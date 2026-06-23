# 정착지원국 | 평화로운 게임마을

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

1. [Neon](https://neon.tech)에서 프로젝트 생성 → **Connection string** → **Pooled** 복사
2. Vercel → **Settings → Environment Variables** 에 아래 설정 (**따옴표 없이** Value만 붙여넣기):

| 변수 | 예시 |
|------|------|
| `DATABASE_URL` | `postgresql://user:pass@ep-xxx-pooler....neon.tech/neondb?sslmode=require` |
| `AUTH_SECRET` | `openssl rand -base64 32` 로 생성 |
| `DISCORD_CLIENT_ID` | Discord 앱 ID |
| `DISCORD_CLIENT_SECRET` | Discord 시크릿 |
| `DISCORD_GUILD_ID` | 디스코드 서버 ID |
| `DISCORD_BOT_TOKEN` | 디스코드 봇 토큰 |
| `NEXTAUTH_URL` | `https://ow-school.vercel.app` (Production) |

**주의:** `DATABASE_URL`은 반드시 `postgresql://` 또는 `postgres://`로 시작해야 합니다.  
`file:./dev.db`(SQLite)나 `"postgresql://..."`(따옴표 포함)는 동작하지 않습니다.

3. 환경 변수 저장 후 **Redeploy** — 빌드 시 자동으로 `db push` + `seed` 실행됩니다.
4. Discord Redirect URI: `https://ow-school.vercel.app/api/auth/callback/discord`
5. 배포 확인: `https://ow-school.vercel.app/api/health`

## Discord 서버 연동 (가입 확인·서버 닉·역할·닉 변경)

### 1. OAuth2 스코프 (Developer Portal → OAuth2)

로그인에 사용: `identify`, `guilds`, `guilds.members.read` (코드에 이미 설정됨)

### 2. 봇 설정 (Developer Portal → Bot)

1. **Bot** 탭에서 봇 생성 → **Token** 복사 → `DISCORD_BOT_TOKEN`
2. **Privileged Gateway Intents** 에서 **Server Members Intent** 켜기
3. 봇 권한: **닉네임 관리(MANAGE_NICKNAMES)** 포함해 서버에 초대

봇 초대 URL (CLIENT_ID 교체):

```
https://discord.com/api/oauth2/authorize?client_id=CLIENT_ID&permissions=134217728&scope=bot
```

`134217728` = Manage Nicknames 권한

### 3. 서버 ID

디스코드 **설정 → 고급 → 개발자 모드** 켠 뒤, 서버 아이콘 우클릭 → **서버 ID 복사** → `DISCORD_GUILD_ID`

### 4. 동작

- 로그인 시 **서버 미가입**이면 로그인 거부
- 마이페이지에서 **서버 닉네임·역할** 표시 및 **닉네임 변경**
- 관리자 학생 목록에 **서버 역할** 표시

`DISCORD_GUILD_ID` / `DISCORD_BOT_TOKEN` 이 없으면 서버 연동 기능은 비활성화되고 일반 로그인만 동작합니다.

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
| `/teacher` | 선생님 마이페이지 (선생님 계정) |
| `/admin` | 관리자 대시보드 |
| `/admin/graduated` | 졸업생 목록 |

관리자 버튼은 우측 하단에 표시됩니다 (관리자만 보임).

## 향후 설계: 홈페이지 관리자 권한 부여 (우선순위 낮음)

1. 홈 푸터 또는 관리자 전용 숨김 UI에서 Discord 로그인 후 권한 요청
2. `AdminRoleRequest` 테이블에 요청자·요청 시각·상태(`pending/approved/rejected`) 저장
3. 기존 관리자가 `/admin/roles`(관리자 리스트)에서 승인 시 `AdminRole` 생성
4. 승인·거절 시 Discord DM 또는 서버 채널 웹훅 알림 (선택)
