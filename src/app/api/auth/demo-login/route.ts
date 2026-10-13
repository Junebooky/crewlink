import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import fs from 'node:fs';
import path from 'node:path';

interface DemoAccountRecord {
  email: string;
  password?: string;
  role: 'client' | 'crew';
  name?: string;
  personId?: string;
}

function loadRegisteredAccounts(): Map<string, DemoAccountRecord> {
  const map = new Map<string, DemoAccountRecord>();
  try {
    const secretsPath = path.resolve(process.cwd(), '.secrets/demo_accounts.json');
    if (fs.existsSync(secretsPath)) {
      const data = JSON.parse(fs.readFileSync(secretsPath, 'utf-8'));
      if (Array.isArray(data?.accounts)) {
        for (const acc of data.accounts) {
          map.set(acc.email, acc);
          if (acc.personId) {
            map.set(acc.personId, acc);
          }
        }
      }
    }
  } catch (err) {
    console.warn('[demo-login] failed to read .secrets/demo_accounts.json:', err);
  }
  return map;
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let requestedEmail = searchParams.get('email');
    let requestedAccountId = searchParams.get('accountId');
    let requestedRole = searchParams.get('role');

    try {
      const body = await request.clone().json();
      if (body?.email) requestedEmail = body.email;
      if (body?.accountId) requestedAccountId = body.accountId;
      if (body?.role) requestedRole = body.role;
    } catch {
      // no json body
    }

    const accountsMap = loadRegisteredAccounts();

    let targetAccount: DemoAccountRecord | null = null;
    if (requestedAccountId && accountsMap.has(requestedAccountId)) {
      targetAccount = accountsMap.get(requestedAccountId)!;
    } else if (requestedEmail && accountsMap.has(requestedEmail)) {
      targetAccount = accountsMap.get(requestedEmail)!;
    } else if (requestedAccountId) {
      // Lookup by person ID in Supabase directly
      const adminClient = createAdminClient();
      const { data: person } = await adminClient
        .from('people')
        .select('id, auth_user_id, full_name, display_name')
        .eq('id', requestedAccountId)
        .maybeSingle();

      if (person?.auth_user_id) {
        const { data: authUser } = await adminClient.auth.admin.getUserById(person.auth_user_id);
        if (authUser?.user?.email && accountsMap.has(authUser.user.email)) {
          targetAccount = accountsMap.get(authUser.user.email)!;
        }
      }
    }

    // Strict validation: No arbitrary fallback
    if (!targetAccount) {
      return NextResponse.json(
        { message: '등록되지 않았거나 유효하지 않은 테스트 계정입니다.' },
        { status: 400 }
      );
    }

    // Role verification
    if (requestedRole && targetAccount.role !== requestedRole) {
      return NextResponse.json(
        { message: '요청한 역할과 계정의 역할이 일치하지 않습니다.' },
        { status: 403 }
      );
    }

    if (!targetAccount.password) {
      return NextResponse.json(
        { message: '계정 로그인 정보를 찾을 수 없습니다.' },
        { status: 500 }
      );
    }

    // 1. Authenticate with Supabase Auth (server SSR client sets session cookies)
    const serverSupabase = await createClient();
    const { data: signInData, error: signInError } = await serverSupabase.auth.signInWithPassword({
      email: targetAccount.email,
      password: targetAccount.password,
    });

    if (signInError || !signInData.user) {
      console.error('[demo-login] signInWithPassword error:', signInError);
      return NextResponse.json(
        { message: signInError?.message || '로그인에 실패했습니다.' },
        { status: 400 }
      );
    }

    // 2. Lookup linked person in crewlink.people
    const adminClient = createAdminClient();
    const { data: person } = await adminClient
      .from('people')
      .select('id, full_name, display_name, crew_profiles(profile_image_url)')
      .eq('auth_user_id', signInData.user.id)
      .maybeSingle();

    const profile = Array.isArray(person?.crew_profiles)
      ? person?.crew_profiles[0]
      : person?.crew_profiles;

    const redirectUrl = targetAccount.role === 'client' ? '/client' : '/crew/schedule';

    return NextResponse.json({
      success: true,
      user: {
        id: signInData.user.id,
        email: targetAccount.email,
        fullName: person?.full_name || person?.display_name || targetAccount.name || targetAccount.email,
        personId: person?.id || null,
        role: targetAccount.role,
        profileImageUrl: profile?.profile_image_url || null,
      },
      redirectUrl,
      session: signInData.session,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '데모 로그인 중 오류가 발생했습니다.';
    console.error('[demo-login] error:', err);
    return NextResponse.json({ message }, { status: 500 });
  }
}
