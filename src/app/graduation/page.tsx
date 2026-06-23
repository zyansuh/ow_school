import { redirect } from 'next/navigation';

/** 졸업면담 작성 — 홈 FAB 등에서 사용하는 짧은 경로 */
export default function GraduationPage() {
  redirect('/interview');
}
