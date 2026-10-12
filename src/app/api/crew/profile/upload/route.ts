import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getAuthenticatedContext } from '@/lib/auth/serverAuth';

/**
 * POST /api/crew/profile/upload
 * 프로필/전신 착장 사진 Storage 업로드 및 Public URL 반환
 */
export async function POST(request: Request) {
  try {
    const { authContext, errorResponse } = await getAuthenticatedContext(request, 'crew');
    if (errorResponse) {
      return errorResponse;
    }
    if (!authContext) {
      return NextResponse.json({ message: '다시 로그인해 주세요.' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = (formData.get('type') as string) || 'avatar'; // 'avatar' | 'full_body'

    if (!file) {
      return NextResponse.json({ message: '업로드할 이미지 파일을 선택해 주세요.' }, { status: 400 });
    }

    // 파일 크기 검증 (최대 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ message: '이미지 용량은 5MB 이하만 가능합니다.' }, { status: 400 });
    }

    // 1. 보안 검증: image/svg+xml 등 스크립트 실행이 가능한 벡터 파일 즉시 차단 (XSS 방어)
    const fileNameLower = file.name.toLowerCase();
    if (file.type === 'image/svg+xml' || fileNameLower.endsWith('.svg')) {
      return NextResponse.json(
        { message: 'SVG 파일은 보안상 업로드할 수 없습니다. (XSS 방어)' },
        { status: 400 }
      );
    }

    // 2. 허용 MIME 타입 화이트리스트 검증 (JPEG, PNG, WebP)
    const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { message: 'JPG, PNG, WebP 형식의 이미지만 업로드 가능합니다.' },
        { status: 400 }
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // 3. 파일 바이너리 헤더 검사로 위장된 SVG/XML 차단
    const headerSnippet = fileBuffer.slice(0, 120).toString('utf-8').toLowerCase();
    if (headerSnippet.includes('<svg') || headerSnippet.includes('<?xml')) {
      return NextResponse.json(
        { message: 'SVG 파일은 보안상 업로드할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 4. 안전한 확장자 매핑 및 파일 경로 sanitize
    const MIME_TO_EXT: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    };
    const safeExt = MIME_TO_EXT[file.type] || 'jpg';
    const fileName = `${type}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${safeExt}`;
    const filePath = `${authContext.personId}/${fileName}`;

    const adminClient = createAdminClient();
    let publicUrl: string | null = null;

    try {
      const { error: uploadError } = await adminClient.storage
        .from('crew-media')
        .upload(filePath, fileBuffer, {
          contentType: file.type,
          upsert: true,
        });

      if (uploadError) {
        // 버킷이 미생성된 경우(로컬/신규 환경) 버킷 자동 생성 시도
        if (
          uploadError.message?.toLowerCase().includes('bucket not found') ||
          uploadError.message?.toLowerCase().includes('not exist')
        ) {
          await adminClient.storage.createBucket('crew-media', {
            public: true,
            fileSizeLimit: 5242880,
          });

          const retry = await adminClient.storage
            .from('crew-media')
            .upload(filePath, fileBuffer, {
              contentType: file.type,
              upsert: true,
            });

          if (!retry.error) {
            const { data: urlData } = adminClient.storage.from('crew-media').getPublicUrl(filePath);
            publicUrl = urlData.publicUrl;
          }
        }
      } else {
        const { data: urlData } = adminClient.storage.from('crew-media').getPublicUrl(filePath);
        publicUrl = urlData.publicUrl;
      }
    } catch (storageErr) {
      console.warn('[Storage upload warning, fallback to base64]:', storageErr);
    }

    // Supabase Storage 연결 불가 시(로컬 오프라인 개발 환경) Base64 Data URL 폴백 지원
    if (!publicUrl) {
      const base64 = fileBuffer.toString('base64');
      publicUrl = `data:${file.type};base64,${base64}`;
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      type,
      message: '사진이 성공적으로 업로드되었습니다.',
    });
  } catch (err: unknown) {
    console.error('[POST /api/crew/profile/upload] Error:', err);
    return NextResponse.json(
      { message: (err as Error).message || '이미지 업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
