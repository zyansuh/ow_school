import { NextRequest, NextResponse } from 'next/server';
import { apiError, requireAdminUser } from '@/lib/api-helpers';
import { TEACHER_AVATAR_MAX_BYTES } from '@/lib/teacher-avatar-constants';
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
        return NextResponse.json({ error: 'JPG, PNG, WEBP 이미지만 업로드할 수 있습니다' }, { status: 400 });
      }
      if (e.message === 'FILE_TOO_LARGE') {
        return NextResponse.json(
          { error: `이미지는 ${TEACHER_AVATAR_MAX_BYTES / (1024 * 1024)}MB 이하만 업로드할 수 있습니다` },
          { status: 400 },
        );
      }
      if (e.message === 'EMPTY_FILE') {
        return NextResponse.json({ error: '빈 파일은 업로드할 수 없습니다' }, { status: 400 });
      }
      if (e.message === 'IMAGE_PROCESS_FAILED') {
        return NextResponse.json(
          { error: '이미지를 처리할 수 없습니다. JPG·PNG·WEBP 파일인지 확인해 주세요.' },
          { status: 400 },
        );
      }
      if (e.message === 'BLOB_NOT_CONFIGURED') {
        return NextResponse.json(
          {
            error:
              '프로덕션 업로드 설정이 필요합니다. Vercel 대시보드 → Storage → Blob을 연결하고 BLOB_READ_WRITE_TOKEN을 설정해 주세요.',
          },
          { status: 503 },
        );
      }
    }
    console.error('[upload/teacher-avatar]', e);
    return apiError(e);
  }
}
