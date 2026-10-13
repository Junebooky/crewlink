import { NextResponse } from 'next/server';
import { getAuthenticatedContext } from '@/lib/auth/serverAuth';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const { authContext, errorResponse } = await getAuthenticatedContext(request);
    if (errorResponse || !authContext) {
      return NextResponse.json({ authenticated: false, roles: [] }, { status: 200 });
    }

    const adminClient = createAdminClient();

    // 1. Crew profile image (if crew role)
    const isCrew = authContext.roles.includes('crew');
    let profileImageUrl: string | null = null;
    if (isCrew) {
      const { data: profile } = await adminClient
        .from('crew_profiles')
        .select('profile_image_url, profile_photo_url')
        .eq('person_id', authContext.personId)
        .maybeSingle();

      profileImageUrl = profile?.profile_image_url || profile?.profile_photo_url || null;
    }

    // 2. Client organization details (if client role)
    const isClient = authContext.roles.includes('client');
    let organization: {
      id: string;
      name: string;
      isVerified: boolean;
      businessRegistrationNumber: string;
    } | null = null;

    if (isClient) {
      const { data: member } = await adminClient
        .from('organization_members')
        .select('organization_id, role, organizations(id, name, is_verified, business_registration_number)')
        .eq('person_id', authContext.personId)
        .eq('is_active', true)
        .maybeSingle();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const org = member?.organizations as any;
      if (org) {
        organization = {
          id: org.id,
          name: org.name,
          isVerified: org.is_verified ?? true,
          businessRegistrationNumber: org.business_registration_number || '120-88-12345',
        };
      }
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
        organization,
      },
    });
  } catch {
    return NextResponse.json({ authenticated: false, roles: [] }, { status: 200 });
  }
}
