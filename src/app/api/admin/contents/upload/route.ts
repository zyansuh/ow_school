import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextRequest, NextResponse } from 'next/server';
import {
  blobStorageStatus,
  mapUploadErrorMessage,
  maxUploadBytes,
  resolveImageMime,
  uploadContentImageServer,
} from '@/lib/contents/upload';
import { apiError, requireAdminUser } from '@/lib/api-helpers';

export const runtime = 'nodejs';
export const maxDuration = 60;

const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/** 관리자용 Blob 연결 상태 (토큰 값은 노출하지 않음) */
export async function GET() {
  try {
    await requireAdminUser();
    return NextResponse.json(blobStorageStatus());
  } catch (e) {
    return apiError(e);
  }
}

async function handleClientBlobUpload(request: NextRequest, body: HandleUploadBody) {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();

  if (body.type === 'blob.generate-client-token' && !token && !process.env.BLOB_STORE_ID?.trim()) {
    throw new Error('BLOB_NOT_CONFIGURED');
  }

  return handleUpload({
    body,
    request,
    ...(token ? { token } : {}),
    onBeforeGenerateToken: async (pathname) => {
      await requireAdminUser();

      if (!pathname.startsWith('contents/')) {
        throw new Error('INVALID_PATH');
      }

      return {
        allowedContentTypes: ALLOWED_CONTENT_TYPES,
        maximumSizeInBytes: maxUploadBytes(),
        addRandomSuffix: false,
      };
    },
    onUploadCompleted: async ({ blob }) => {
      console.info('[contents/upload] client upload completed:', blob.url);
    },
  });
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get('content-type') ?? '';

  try {
    if (contentType.includes('application/json')) {
      const body = (await req.json()) as HandleUploadBody;
      const result = await handleClientBlobUpload(req, body);
      return NextResponse.json(result);
    }

    await requireAdminUser();
    const form = await req.formData();
    const file = form.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: '이미지 파일을 선택하세요' }, { status: 400 });
    }

    if (!resolveImageMime(file)) {
      return NextResponse.json({ error: 'JPEG·PNG·WebP·GIF만 업로드할 수 있습니다' }, { status: 400 });
    }

    const limit = maxUploadBytes();
    if (file.size > limit) {
      return NextResponse.json(
        {
          error:
            limit <= 4 * 1024 * 1024
              ? 'Vercel 배포 환경에서는 이미지가 4MB 이하여야 합니다'
              : '이미지는 8MB 이하여야 합니다',
        },
        { status: 400 },
      );
    }

    const url = await uploadContentImageServer(file);
    return NextResponse.json({ url });
  } catch (e) {
    const mapped = mapUploadErrorMessage(e);
    if (mapped) {
      return NextResponse.json({ error: mapped.message }, { status: mapped.status });
    }
    console.error('[contents/upload]', e);
    return apiError(e);
  }
}
