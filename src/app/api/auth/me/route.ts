import { NextResponse } from 'next/server';
import { getAuthenticatedContext } from '@/lib/auth/serverAuth';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const { authContext, errorResponse } = await getAuthenticatedContext(request);
    if (errorResponse || !authContext) {
      return NextResponse.json({ authenticated: false, roles: [] }, { status: 200 });
    }

    // 크루 프로필 사진 조회 (크루 역할일 때만 프로필 사진 제공)
    const isCrew =
      authContext.roles.includes('crew') &&
      !authContext.roles.includes('client') &&
      !authContext.roles.includes('ops');

    let profileImageUrl: string | null = null;
    if (isCrew) {
      const adminClient = createAdminClient();
      const { data: profile } = await adminClient
        .from('crew_profiles')
        .select('profile_image_url, profile_photo_url')
        .eq('person_id', authContext.personId)
        .maybeSingle();

      profileImageUrl = profile?.profile_image_url || profile?.profile_photo_url || null;
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: authContext.userId,
        personId: authContext.personId,
        fullName: authContext.fullName,
        email: authContext.email,
        roles: authContext.roles,
        profileImageUrl,
      },
    });
  } catch {
    return NextResponse.json({ authenticated: false, roles: [] }, { status: 200 });
  }
}
