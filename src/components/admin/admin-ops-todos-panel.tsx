'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { ds } from '@/styles/design-system';
import type { OpsTodosPayload } from '@/lib/admin/ops-todos';
import { AlertTriangle, ClipboardList, UserX, Users } from 'lucide-react';

export function AdminOpsTodosPanel() {
  const [data, setData] = useState<OpsTodosPayload | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/admin/ops-todos')
      .then((r) => r.json())
      .then((d) => {
        if (d?.byClass) setData(d);
        else setError(true);
      })
      .catch(() => setError(true));
  }, []);

  if (error) return null;
  if (!data) {
    return (
      <Card className={`${ds.card} ${ds.cardPad}`}>
        <h2 className={ds.sectionTitle}>오늘 할 일</h2>
        <p className="text-sm text-muted-foreground mt-2">불러오는 중…</p>
      </Card>
    );
  }

  const { totals, byClass } = data;
  const empty =
    totals.pendingApplications === 0 &&
    totals.activeNoInterview === 0 &&
    totals.nearFullTeacherCount === 0 &&
    totals.inactiveTeacherStudentCount === 0;

  return (
    <Card className={`${ds.card} ${ds.cardPad}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className={ds.sectionTitle}>오늘 할 일</h2>
        <p className="text-xs text-muted-foreground">반별 운영 체크리스트</p>
      </div>

      {empty ? (
        <p className="text-sm text-muted-foreground mt-3">처리할 항목이 없습니다.</p>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
            <TodoStat
              icon={ClipboardList}
              label="미승인 신청"
              value={totals.pendingApplications}
              href="/admin/applications"
            />
            <TodoStat
              icon={Users}
              label="면담 미제출"
              value={totals.activeNoInterview}
              href="/admin/students?quick=noInterview"
            />
            <TodoStat
              icon={AlertTriangle}
              label="정원 임박 선생님"
              value={totals.nearFullTeacherCount}
              href="/admin/teachers?nearFull=1"
            />
            <TodoStat
              icon={UserX}
              label="비활성 선생님 담당"
              value={totals.inactiveTeacherStudentCount}
              href="/admin/students"
              suffix="명"
            />
          </div>

          <div className="mt-6 space-y-4">
            {byClass.map((b) => (
              <div key={b.className} className="border-t border-border pt-3">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <h3 className="text-sm font-semibold text-foreground">{b.className}</h3>
                  <Link
                    href={`/admin/students?class=${encodeURIComponent(b.className)}`}
                    className="text-xs text-primary hover:underline"
                  >
                    학생 보기
                  </Link>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {b.pendingApplications > 0 && (
                    <li>
                      미승인 신청{' '}
                      <span className="text-foreground font-medium">{b.pendingApplications}</span>건
                    </li>
                  )}
                  {b.activeNoInterview > 0 && (
                    <li>
                      면담 미제출{' '}
                      <Link
                        href={`/admin/students?class=${encodeURIComponent(b.className)}&quick=noInterview`}
                        className="text-primary hover:underline font-medium"
                      >
                        {b.activeNoInterview}명
                      </Link>
                    </li>
                  )}
                  {b.nearFullTeachers.map((t) => (
                    <li key={t.teacherId}>
                      정원 임박 · {t.teacherName} ({t.current}/{t.max}, 잔여 {t.remaining})
                    </li>
                  ))}
                  {b.inactiveTeachers.map((t) => (
                    <li key={t.teacherId}>
                      비활성 · {t.teacherName} 담당{' '}
                      <Link
                        href={`/admin/students?teacherId=${t.teacherId}`}
                        className="text-primary hover:underline font-medium"
                      >
                        {t.studentCount}명
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

function TodoStat({
  icon: Icon,
  label,
  value,
  href,
  suffix = '',
}: {
  icon: typeof Users;
  label: string;
  value: number;
  href: string;
  suffix?: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-border bg-muted/30 px-3 py-3 hover:border-primary/40 transition-colors"
    >
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-xl font-semibold text-foreground tabular-nums">
        {value}
        {suffix && <span className="text-sm font-normal text-muted-foreground ml-0.5">{suffix}</span>}
      </p>
    </Link>
  );
}
