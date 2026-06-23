import { NextRequest, NextResponse } from 'next/server';
import { apiError, requireAdminUser } from '@/lib/api-helpers';
import { getMonthlyPointReport } from '@/lib/admin-points';

function parseYearMonth(req: NextRequest) {
  const year = Number(req.nextUrl.searchParams.get('year'));
  const month = Number(req.nextUrl.searchParams.get('month'));
  const now = new Date();
  const y = Number.isFinite(year) && year >= 2020 ? year : now.getFullYear();
  const m = Number.isFinite(month) && month >= 1 && month <= 12 ? month : now.getMonth() + 1;
  return { year: y, month: m };
}

export async function GET(req: NextRequest) {
  try {
    await requireAdminUser();
    const { year, month } = parseYearMonth(req);
    const report = await getMonthlyPointReport(year, month);
    return NextResponse.json(report);
  } catch (e) {
    return apiError(e);
  }
}
