# 정착지원국 — 앞으로 해야 할 것 & 추천 목록

> 최종 업데이트: 2026-06-23  
> 긴급 버그 수정(Discord ID·teacherId 통일) 이후 기준

---

## 🔴 필수 (배포 직후)

| # | 항목 | 설명 | 우선순위 |
|---|------|------|----------|
| 1 | **프로덕션 DB 마이그레이션 확인** | `Teacher.discordUserId` 컬럼이 Neon에 반영됐는지 Vercel 빌드 로그 확인 | 🔴 즉시 |
| 2 | **Discord 동기화 1회 실행** | `/admin` → 「Discord 동기화」 — 닉·역할·학생 수·선생님 연결 일괄 정리 | 🔴 즉시 |
| 3 | **담당 학생 수 검증** | 선생님 카드 인원 = 상세 페이지 인원 일치 여부 수동 확인 (2~3명 샘플) | 🔴 즉시 |
| 4 | **닉 변경 E2E 테스트** | 마이페이지 닉 변경 → 새로고침 → 로그아웃/재로그인 → 포인트·면담·선생님 연결 유지 | 🔴 즉시 |
| 5 | **미커밋 변경사항 배포** | Discord ID 수정·다크모드 제거·동기화 API 등 변경분 `main` 푸시 | 🔴 즉시 |

---

## 🟠 코드·구조 개선 (단기)

| # | 항목 | 현재 문제 | 권장 조치 |
|---|------|----------|----------|
| 6 | **`resolveTeacherForUser` 역할 폴백** | Discord 역할만 있으면 `findFirst()`로 아무 선생님 반환 | 역할→선생님 매핑 테이블 또는 Teacher 등록 시 `discordUserId` 필수 입력 |
| 7 | **선생님 `discordUserId` 백필 UI** | username 매칭만으로는 불완전 | 관리자 선생님 수정 폼에 Discord User ID 입력 필드 추가 |
| 8 | **`next-themes` 패키지 제거** | 다크모드 토글 삭제 후 미사용 의존성 잔존 | `package.json`에서 삭제 + `npm install` |
| 9 | **`Application` GET 레거시** | `?discord=` 쿼리로 닉네임 조회 가능 | `userId` / `discordId` 기준으로 전환, 레거시 deprecate |
| 10 | **`siteDisplayName` 필드 정리** | `discordServerNick`과 역할 중복 | 사용처 조사 후 deprecated → 제거 마이그레이션 |
| 11 | **동기화 리포트 UI 강화** | `teacherLinkMismatches`가 건수만 표시 | 불일치 목록 테이블 + 「연결 수정」 버튼 |
| 12 | **라이트 모드 CSS 잔여 정리** | `dark:` 접두사·미사용 테마 클래스 | `globals.css`·컴포넌트 일괄 정리 |

---

## 🟡 기능 확장 (중기)

| # | 항목 | 기대 효과 |
|---|------|----------|
| 13 | **Discord 웹훅 / Gateway** | 서버에서 닉 변경 시 홈페이지 자동 반영 (로그인·동기화 버튼 없이) |
| 14 | **로그인 시 자동 Teacher 링크** | 선생님 계정 로그인 → `discordUserId` 자동 백필 + `isTeacher` 세션 갱신 |
| 15 | **관리자 권한 요청 플로우** | `AdminRoleRequest` 테이블 + `/admin/roles` 승인 UI (README 향후 설계 구현) |
| 16 | **선생님 담당 학생 엑셀** | `/teacher/students` 또는 관리자에서 CSV/엑셀 다운로드 |
| 17 | **졸업면담 알림** | 제출 시 담당 선생님 Discord DM 또는 채널 웹훅 |
| 18 | **포인트 사용처** | 포인트 조회만 가능 → 상점·리워드 연동 설계 |
| 19 | **신청 대기(pending) 플로우** | 현재 즉시 approved — 관리자 승인 대기 옵션 |
| 20 | **반 이동 / 담당 선생님 변경** | 관리자 UI에서 `teacherId` 변경 시 기존 면담·포인트 유지 검증 |

---

## 🟢 운영·품질 (지속)

| # | 항목 | 설명 |
|---|------|------|
| 21 | **E2E 테스트 (Playwright)** | 로그인 → 신청 → 면담 → 닉 변경 시나리오 자동화 |
| 22 | **ESLint 설정** | 현재 `tsc --noEmit`만 — `eslint` + `typescript-eslint` 추가 |
| 23 | **API 통합 테스트** | `discord-sync`, `applications`, `interviews` 핵심 API |
| 24 | **에러 모니터링** | Sentry 또는 Vercel Analytics 연동 |
| 25 | **정기 Discord 동기화** | Vercel Cron → `POST /api/admin/discord-sync` (관리자 토큰 보호) |
| 26 | **DB 백업 정책** | Neon PITR·브랜치 백업 주기 문서화 |
| 27 | **감사 로그 확장** | 선생님 변경·담당 학생 이동·포인트 수동 조정 기록 |

---

## 💡 추천 목록 (우선순위 순)

### 이번 주에 하면 좋은 것

1. **배포 + Discord 동기화 1회** — 데이터 정합성 즉시 회복  
2. **선생님 3명 수동 검증** — 카드 인원 / 상세 / teacher 페이지 일치  
3. **`next-themes` 제거** — 5분 작업, 의존성 정리  
4. **관리자 선생님 폼에 `discordUserId`** — 재발 방지 핵심  

### 다음 스프린트

5. **Discord 웹훅** — 닉 실시간 동기화 (운영 불만 최소화)  
6. **Playwright 스모크 테스트** — 배포 전 회귀 방지  
7. **동기화 불일치 UI** — 관리자가 셀프 서비스로 수정  
8. **Vercel Cron 동기화** — 주 1회 자동 닉·역할 갱신  

### 장기 로드맵

9. **포인트 리워드 시스템** — 졸업면담 참여율 ↑  
10. **관리자 권한 요청 워크플로** — Discord username 화이트리스트 의존 ↓  
11. **멀티 길드 지원** — 커뮤니티 확장 시  
12. **모바일 PWA** — 홈 화면 추가·푸시 알림  

---

## ✅ 이미 완료된 항목 (참고)

- [x] 사용자 식별 `discordId` 기준 통일  
- [x] 학생↔선생님 `teacherId` 기준 통일  
- [x] 담당 학생 수 live count + `syncTeacherStudentCount`  
- [x] 선생님 상세 — 담당 학생 표 (서버닉·반·신청일·졸업·면담)  
- [x] 다크모드 토글 제거 (다크 고정)  
- [x] 관리자 「Discord 동기화」 API·버튼  
- [x] `updateGuildNickname` — `isInGuild` 유지  
- [x] 화면 표시: 서버닉 → 글로벌 → 유저네임  
- [x] README Gamema 스타일 업데이트  
- [x] TypeScript lint 통과 · Production build 성공  

---

## 📋 체크리스트 (배포 후 복사해서 사용)

```
[ ] Vercel Redeploy 완료
[ ] Neon에 Teacher.discordUserId 컬럼 존재
[ ] /admin → Discord 동기화 실행
[ ] 선생님 A: 카드 인원 = 상세 인원
[ ] 선생님 B: 카드 인원 = 상세 인원
[ ] 테스트 계정 닉 변경 → 마이페이지·헤더 정상
[ ] 테스트 계정 닉 변경 → 포인트 내역 유지
[ ] 테스트 계정 닉 변경 → 졸업면담 유지
[ ] 테스트 계정 닉 변경 → 담당 선생님 유지
[ ] /api/health 200 OK
```
