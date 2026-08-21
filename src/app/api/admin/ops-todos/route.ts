import { NextResponse } from 'next/server';
import { apiError, requireAdminUser } from '@/lib/api-helpers';
import { getAdminOpsTodos } from '@/lib/admin/ops-todos';

export async function GET() {
  try {
    await requireAdminUser();
    const todos = await getAdminOpsTodos();
    return NextResponse.json(todos);
  } catch (e) {
    return apiError(e);
  }
}
