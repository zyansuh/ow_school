/**
 * 선생님 비활성(isActive) vs 모집마감(maxStudents/정원) 분리 검증
 * 실행: node scripts/verify-recruiting.mjs
 */

function getRecruitmentStatus(maxStudents, activeCount) {
  if (maxStudents <= 0) return 'closed';
  if (activeCount >= maxStudents) return 'full';
  return 'open';
}

function canAcceptNewStudent(maxStudents, activeCount, isActive) {
  return isActive && getRecruitmentStatus(maxStudents, activeCount) === 'open';
}

function isTeacherVisibleToApplicants(isActive) {
  return isActive;
}

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL:', msg);
    failed += 1;
  } else {
    console.log('OK:', msg);
  }
}

// 모집마감: 보이되 선택 불가
assert(isTeacherVisibleToApplicants(true) === true, '활성 선생님은 목록에 보임');
assert(getRecruitmentStatus(0, 0) === 'closed', 'maxStudents=0 → 모집 마감');
assert(canAcceptNewStudent(0, 0, true) === false, '모집 마감은 선택 불가');

// 정원 마감: 보이되 선택 불가
assert(getRecruitmentStatus(5, 5) === 'full', '정원 가득 → full');
assert(canAcceptNewStudent(5, 5, true) === false, '정원 마감은 선택 불가');
assert(isTeacherVisibleToApplicants(true) === true, '정원 마감이어도 활성면 노출');

// 비활성: 숨김
assert(isTeacherVisibleToApplicants(false) === false, '비활성은 신규 목록에서 숨김');
assert(canAcceptNewStudent(5, 0, false) === false, '비활성은 배정 불가');
assert(getRecruitmentStatus(5, 0) === 'open', '비활성과 무관하게 모집 상태는 open 가능');

// 정상 모집
assert(canAcceptNewStudent(5, 2, true) === true, '활성+여유 정원 → 배정 가능');

if (failed > 0) {
  console.error(`\n${failed} assertion(s) failed`);
  process.exit(1);
}
console.log('\nAll recruiting assertions passed');
