import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth/rbac';
import { normalizeNickFields, userDisplayName } from '@/lib/users/display';

export async function canAccessInterview(
  interviewUserId: string,
  sessionUserId: string,
): Promise<'owner' | 'admin' | null> {
  if (interviewUserId === sessionUserId) return 'owner';
  try {
    await requireAdmin(sessionUserId);
    return 'admin';
  } catch {
    return null;
  }
}

export async function getInterviewForUser(interviewId: string, sessionUserId: string) {
  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: { teacher: true, user: true },
  });
  if (!interview) return null;

  const role = await canAccessInterview(interview.userId, sessionUserId);
  if (!role) return null;

  return { interview, role };
}

export function interviewAuthorName(user: {
  discordUsername: string;
  discordNickname?: string | null;
  discordServerNick?: string | null;
}) {
  return userDisplayName(normalizeNickFields(user));
}
