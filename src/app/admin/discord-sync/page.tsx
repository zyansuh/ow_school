'use client';

import { DiscordSyncPanel } from '@/components/admin/discord-sync/discord-sync-panel';

export default function AdminDiscordSyncPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Discord 동기화</h1>
        <p className="text-sm text-gray-400 mt-1">
          서버 닉네임·역할을 최신화하고, 담당 학생 수와 반장 연결을 검증합니다.
        </p>
      </div>
      <DiscordSyncPanel />
    </div>
  );
}
