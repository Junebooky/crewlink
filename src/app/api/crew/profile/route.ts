import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getAuthenticatedContext } from '@/lib/auth/serverAuth';

/**
 * GET /api/crew/profile
 * 현재 로그인된 세션 사용자의 크루 프로필 조회
 */
export async function GET(request: Request) {
  try {
    const { authContext, errorResponse } = await getAuthenticatedContext(request, 'crew');
    if (errorResponse) {
      return errorResponse;
    }
    if (!authContext) {
      return NextResponse.json({ message: '다시 로그인해 주세요.' }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // 1. 크루 프로필 조회
    const { data: profile } = await adminClient
      .from('crew_profiles')
      .select('*')
      .eq('person_id', authContext.personId)
      .maybeSingle();

    // 2. 비공개 연락처 정보 조회
    const { data: contact } = await adminClient
      .from('private_contact_details')
      .select('phone_number, email')
      .eq('person_id', authContext.personId)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      personId: authContext.personId,
      fullName: authContext.fullName,
      phoneNumber: contact?.phone_number || '',
      email: authContext.email || contact?.email || '',
      profile: {
        profileImageUrl: profile?.profile_image_url || profile?.profile_photo_url || null,
        fullBodyImageUrl: profile?.full_body_image_url || null,
        heightCm: profile?.height_cm || null,
        topSize: profile?.top_size || profile?.uniform_size || 'L',
        bottomSize: profile?.bottom_size || '30',
        shoeSizeMm: profile?.shoe_size_mm || 265,
        experienceYears: profile?.experience_years ? Number(profile.experience_years) : 0,
        bio: profile?.bio || '',
        languages: profile?.languages || ['한국어'],
        ratingAvg: profile?.rating_avg || 5.0,
        totalShiftsCompleted: profile?.total_shifts_completed || 0,
        updatedAt: profile?.updated_at || null,
      },
    });
  } catch (err: unknown) {
    console.error('[GET /api/crew/profile] Error:', err);
    return NextResponse.json(
      { message: (err as Error).message || '프로필을 불러오지 못했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/crew/profile
 * 신체 스펙, 유니폼 사이즈, bio, 착장 사진 URL 등 저장
 */
export async function PUT(request: Request) {
  try {
    const { authContext, errorResponse } = await getAuthenticatedContext(request, 'crew');
    if (errorResponse) {
      return errorResponse;
    }
    if (!authContext) {
      return NextResponse.json({ message: '다시 로그인해 주세요.' }, { status: 401 });
    }

    const body = await request.json();
    const {
      fullName,
      phoneNumber,
      profileImageUrl,
      fullBodyImageUrl,
      heightCm,
      topSize,
      bottomSize,
      shoeSizeMm,
      experienceYears,
      bio,
      languages,
    } = body;

    const adminClient = createAdminClient();

    // 1. 이름 업데이트 (수정 시)
    if (fullName && fullName.trim() !== authContext.fullName) {
      await adminClient
        .from('people')
        .update({
          full_name: fullName.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', authContext.personId);
    }

    // 2. 비공개 연락처 업데이트
    if (phoneNumber) {
      await adminClient
        .from('private_contact_details')
        .upsert(
          {
            person_id: authContext.personId,
            phone_number: phoneNumber.trim(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'person_id' }
        );
    }

    // 3. crew_profiles 테이블 upsert
    const { data: updatedProfile, error: profileError } = await adminClient
      .from('crew_profiles')
      .upsert(
        {
          person_id: authContext.personId,
          profile_image_url: profileImageUrl || null,
          profile_photo_url: profileImageUrl || null,
          full_body_image_url: fullBodyImageUrl || null,
          height_cm: heightCm ? Number(heightCm) : null,
          top_size: topSize || null,
          uniform_size: topSize || null,
          bottom_size: bottomSize || null,
          shoe_size_mm: shoeSizeMm ? Number(shoeSizeMm) : null,
          experience_years: experienceYears !== undefined ? Number(experienceYears) : 0,
          bio: bio || '',
          languages: Array.isArray(languages) ? languages : ['한국어'],
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'person_id' }
      )
      .select('*')
      .single();

    if (profileError) {
      console.error('[PUT /api/crew/profile] Upsert error:', profileError);
      return NextResponse.json(
        { message: profileError.message || '프로필 정보를 저장하지 못했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '프로필 정보가 안전하게 저장되었습니다.',
      profile: updatedProfile,
    });
  } catch (err: unknown) {
    console.error('[PUT /api/crew/profile] Error:', err);
    return NextResponse.json(
      { message: (err as Error).message || '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
