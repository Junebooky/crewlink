import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';

// Mock serverAuth
vi.mock('@/lib/auth/serverAuth', () => ({
  getAuthenticatedContext: vi.fn().mockResolvedValue({
    authContext: {
      personId: '11111111-1111-1111-1111-111111111111',
      fullName: '테스트 크루',
      email: 'crew@test.com',
      role: 'crew',
    },
    errorResponse: null,
  }),
}));

// Mock Supabase admin client
vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: vi.fn().mockReturnValue({
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test/avatar.jpg' }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://mock-supabase.co/storage/v1/object/public/crew-media/test/avatar.jpg' },
        }),
      }),
      createBucket: vi.fn().mockResolvedValue({}),
    },
  }),
}));

describe('POST /api/crew/profile/upload 보안 및 MIME 타입 검증', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('image/svg+xml 벡터 파일 업로드 시 400 에러 및 XSS 차단 메시지를 반환해야 한다', async () => {
    const svgBlob = new Blob(['<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'], {
      type: 'image/svg+xml',
    });
    const formData = new FormData();
    formData.append('file', svgBlob, 'malicious.svg');
    formData.append('type', 'avatar');

    const request = new Request('http://localhost:3000/api/crew/profile/upload', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(request);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.message).toContain('SVG');
  });

  it('확장자가 .svg인 파일은 MIME 타입과 관계없이 차단해야 한다', async () => {
    const fakeBlob = new Blob(['fake content'], { type: 'image/png' });
    const formData = new FormData();
    formData.append('file', fakeBlob, 'attack.svg');
    formData.append('type', 'avatar');

    const request = new Request('http://localhost:3000/api/crew/profile/upload', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(request);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.message).toContain('SVG');
  });

  it('바이너리 내용에 <svg 태그가 포함된 위장 파일은 400 에러로 차단해야 한다', async () => {
    const fakeJpgWithSvg = new Blob(['\xFF\xD8\xFF\xE0 <svg onload="alert(1)">'], { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('file', fakeJpgWithSvg, 'photo.jpg');
    formData.append('type', 'avatar');

    const request = new Request('http://localhost:3000/api/crew/profile/upload', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(request);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.message).toContain('SVG');
  });

  it('허용되지 않은 MIME 타입(예: text/plain, image/gif)은 400 에러를 반환해야 한다', async () => {
    const textBlob = new Blob(['hello world'], { type: 'text/plain' });
    const formData = new FormData();
    formData.append('file', textBlob, 'test.txt');
    formData.append('type', 'avatar');

    const request = new Request('http://localhost:3000/api/crew/profile/upload', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(request);
    expect(res.status).toBe(400);
  });

  it('정상적인 JPEG/PNG/WebP 이미지는 업로드에 성공하고 Public URL을 반환해야 한다', async () => {
    const validJpg = new Blob(['fake-jpg-binary-stream-12345'], { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('file', validJpg, 'profile.jpg');
    formData.append('type', 'avatar');

    const request = new Request('http://localhost:3000/api/crew/profile/upload', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(request);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.url).toBeDefined();
  });
});
