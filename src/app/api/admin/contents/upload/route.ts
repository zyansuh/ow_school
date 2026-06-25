import { NextRequest, NextResponse } from 'next/server';
import { apiError, requireAdminUser } from '@/lib/api-helpers';
import { uploadContentImage } from '@/lib/contents/upload';

export async function POST(req: NextRequest) {
  try {
    await requireAdminUser();
    const form = await req.formData();
    const file = form.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: '이미지 파일을 선택하세요' }, { status: 400 });
    }

    const url = await uploadContentImage(file);
    return NextResponse.json({ url });
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === 'BLOB_NOT_CONFIGURED') {
        return NextResponse.json(
          { error: 'BLOB_READ_WRITE_TOKEN 환경 변수가 필요합니다. Vercel Blob을 설정하세요.' },
          { status: 503 },
        );
      }
      if (e.message === 'INVALID_IMAGE_TYPE') {
        return NextResponse.json({ error: 'JPEG·PNG·WebP·GIF만 업로드할 수 있습니다' }, { status: 400 });
      }
      if (e.message === 'IMAGE_TOO_LARGE') {
        return NextResponse.json({ error: '이미지는 8MB 이하여야 합니다' }, { status: 400 });
      }
    }
    return apiError(e);
  }
}
