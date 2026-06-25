import { redirect } from 'next/navigation';

export { dynamic } from '@/lib/utils/segment';

/** 전체 반장 목록 대신 클래스 소개에서 반을 먼저 선택하도록 유도 */
export default function TeachersPage() {
  redirect('/#classes');
}
