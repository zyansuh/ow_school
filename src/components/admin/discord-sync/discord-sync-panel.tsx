'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { adminStyles } from '@/styles/admin';
import { useDiscordSync } from '@/hooks/admin/use-discord-sync';

type OpsStatus = {
  schema: { teacherDiscordUserId: boolean; siteDisplayNameRemoved: boolean; adminRoleRequestTable: boolean };
  discord: { guildConfigured: boolean; webhookConfigured: boolean; cronConfigured: boolean };
  teachersMissingDiscordUserId: number;
  readyForSync: boolean;
};

export function DiscordSyncPanel({ onSynced }: { onSynced?: () => void }) {
  const { syncing, report, runSync, fixLink } = useDiscordSync();
  const [ops, setOps] = useState<OpsStatus | null>(null);

  useEffect(() => {
    fetch('/api/admin/ops-status').then((r) => r.json()).then(setOps).catch(() => {});
  }, [report]);

  const handleSync = async () => {
    const result = await runSync();
    if (result) {
      onSynced?.();
      fetch('/api/admin/ops-status').then((r) => r.json()).then(setOps).catch(() => {});
    }
  };

  const handleFix = async (userId: string, teacherId: string | null) => {
    const ok = await fixLink(userId, teacherId);
    if (ok) {
      const result = await runSync();
      if (result) onSynced?.();
    }
  };

  return (
    <Card className={adminStyles.card}>
      <div className={`${adminStyles.cardPad} space-y-3`}>
        <h2 className="font-semibold">Discord 동기화</h2>
        <p className={adminStyles.muted}>
          서버 닉네임·역할 최신화, 담당 학생 수 재계산, 선생님 연결 검증
        </p>

        {ops && (
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant={ops.schema.teacherDiscordUserId ? 'success' : 'danger'}>
              discordUserId 컬럼 {ops.schema.teacherDiscordUserId ? 'OK' : '없음'}
            </Badge>
            <Badge variant={ops.schema.siteDisplayNameRemoved ? 'success' : 'warning'}>
              siteDisplayName {ops.schema.siteDisplayNameRemoved ? '제거됨' : '잔존'}
            </Badge>
            <Badge variant={ops.discord.guildConfigured ? 'success' : 'warning'}>Guild 연동</Badge>
            <Badge variant={ops.discord.webhookConfigured ? 'success' : 'outline'}>웹훅</Badge>
            {ops.teachersMissingDiscordUserId > 0 && (
              <Badge variant="warning">ID 미연결 선생님 {ops.teachersMissingDiscordUserId}명</Badge>
            )}
          </div>
        )}

        <Button onClick={handleSync} disabled={syncing || ops?.readyForSync === false}>
          {syncing ? '동기화 중...' : 'Discord 동기화'}
        </Button>

        {report && (
          <div className={`${adminStyles.muted} space-y-3 pt-2 border-t border-gray-800`}>
            <p>동기화 성공: {report.usersSynced}명 · 실패: {report.usersFailed}명</p>
            <p>선생님 학생 수 재계산: {report.teachersRecounted}명</p>

            {report.studentCountMismatches.length > 0 && (
              <p className={adminStyles.warning}>
                학생 수 불일치 {report.studentCountMismatches.length}건 (동기화로 수정됨)
              </p>
            )}

            {report.teachersMissingDiscordUserId.length > 0 && (
              <div>
                <p className={adminStyles.warning}>discordUserId 미연결 선생님 {report.teachersMissingDiscordUserId.length}명</p>
                <ul className="text-xs space-y-1 mt-1">
                  {report.teachersMissingDiscordUserId.map((t) => (
                    <li key={t.teacherId}>{t.teacherName} (@{t.discordUsername ?? '미설정'})</li>
                  ))}
                </ul>
              </div>
            )}

            {report.teacherLinkMismatches.length > 0 && (
              <div className="overflow-x-auto border border-gray-800 rounded-lg">
                <table className="w-full text-xs">
                  <thead>
                    <tr className={adminStyles.tableHead}>
                      <th className="p-2">학생</th>
                      <th className="p-2">현재</th>
                      <th className="p-2">예상</th>
                      <th className="p-2">수정</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.teacherLinkMismatches.map((m) => (
                      <tr key={m.userId} className={adminStyles.tableRow}>
                        <td className="p-2 text-gray-200">{m.displayName}</td>
                        <td className="p-2 text-gray-400">{m.actualTeacherName ?? '없음'}</td>
                        <td className="p-2 text-purple-300">{m.expectedTeacherName ?? '없음'}</td>
                        <td className="p-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleFix(m.userId, m.expectedTeacherId)}
                          >
                            예상값 적용
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
