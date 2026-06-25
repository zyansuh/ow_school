'use client';

import { UserDisplayNickEdit } from '@/components/admin/user-display-nick-edit';

type Props = {
  studentId: string;
  currentDisplay: string;
  displayNickname: string | null;
  guildNickname: string;
  onSaved: () => void;
};

export function StudentDisplayNickEdit({
  studentId,
  currentDisplay,
  displayNickname,
  guildNickname,
  onSaved,
}: Props) {
  return (
    <UserDisplayNickEdit
      userId={studentId}
      saveUrl={`/api/admin/students/${studentId}`}
      currentDisplay={currentDisplay}
      displayNickname={displayNickname}
      guildNickname={guildNickname}
      onSaved={onSaved}
    />
  );
}
