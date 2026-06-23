import { NextRequest, NextResponse } from 'next/server';
import { apiError, requireAdminUser } from '@/lib/api-helpers';
import { saveTeacherAvatar } from '@/lib/teacher-avatar-upload';

export async function POST(req: NextRequest) {
  try {
    await requireAdminUser();

    const form = await req.formData();
    const file = form.get('file');

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: '이미지 파일을 선택해주세요' }, { status: 400 });
    }

    const url = await saveTeacherAvatar(file);
    return NextResponse.json({ url });
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === 'INVALID_TYPE') {
        return NextResponse.json({ error: 'JPG, PNG, WebP, GIF, HEIC 이미지만 업로드할 수 있습니다' }, { status: 400 });
      }
      if (e.message === 'FILE_TOO_LARGE') {
        return NextResponse.json({ error: '이미지는 5MB 이하만 업로드할 수 있습니다' }, { status: 400 });
      }
      if (e.message === 'BLOB_NOT_CONFIGURED') {
        return NextResponse.json(
          { error: '프로덕션 업로드 설정(BLOB_READ_WRITE_TOKEN)이 필요합니다. Vercel Storage → Blob을 연결해주세요.' },
          { status: 503 },
        );
      }
    }
    return apiError(e);
  }
}
