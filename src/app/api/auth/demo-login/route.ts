import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let role = searchParams.get('role');
    if (!role) {
      try {
        const body = await request.clone().json();
        role = body?.role;
      } catch {
        // no body
      }
    }

    const isClient = role === 'client';
    const email = isClient ? 'client@crewlink.kr' : 'crew@crewlink.kr';
    const password = 'crewlink2026!';
    const fullName = isClient ? '박대표' : '김크루';
    const personId = isClient
      ? '33333333-3333-3333-3333-333333333333'
      : '11111111-1111-1111-1111-111111111111';

    const adminClient = createAdminClient();

    // 1. Check if user exists in auth.users
    const { data: userList } = await adminClient.auth.admin.listUsers();
    let authUser = userList?.users?.find((u) => u.email === email);

    if (!authUser) {
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, role: isClient ? 'client' : 'crew' },
      });

      if (createError || !newUser?.user) {
        console.error('[demo-login] createUser error:', createError);
        return NextResponse.json({ message: createError?.message || '계정 생성 실패' }, { status: 500 });
      }
      authUser = newUser.user;
    } else {
      // Update password to ensure match
      await adminClient.auth.admin.updateUserById(authUser.id, {
        password,
        email_confirm: true,
      });
    }

    // 2. Link auth_user_id in crewlink.people
    await adminClient
      .from('people')
      .update({ auth_user_id: authUser.id })
      .eq('id', personId);

    // 3. Authenticate session and set cookies via createClient()
    const serverSupabase = await createClient();
    const { data: signInData, error: signInError } = await serverSupabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error('[demo-login] signInWithPassword error:', signInError);
      return NextResponse.json({ message: signInError.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authUser.id,
        email,
        fullName: isClient ? '(주)네온패밀리' : '김크루',
        personId,
        role: isClient ? 'client' : 'crew',
      },
      session: signInData.session,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '데모 로그인 중 오류가 발생했습니다.';
    console.error('[demo-login] error:', err);
    return NextResponse.json({ message }, { status: 500 });
  }
}
