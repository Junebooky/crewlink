import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';

// Known registered demo accounts for MVP login helper
const DEMO_ACCOUNTS: Record<string, { email: string; password: string; role: 'client' | 'crew' }> = {
  'client_metaverse@crewlink.kr': {
    email: 'client_metaverse@crewlink.kr',
    password: 'CrewLink2026!client-nextwave',
    role: 'client',
  },
  'client_exhibition@crewlink.kr': {
    email: 'client_exhibition@crewlink.kr',
    password: 'CrewLink2026!client-mice',
    role: 'client',
  },
  'client_festival@crewlink.kr': {
    email: 'client_festival@crewlink.kr',
    password: 'CrewLink2026!client-liveculture',
    role: 'client',
  },
  'crew_doyoon@crewlink.kr': {
    email: 'crew_doyoon@crewlink.kr',
    password: 'CrewLink2026!crew-1',
    role: 'crew',
  },
  'crew_seojun@crewlink.kr': {
    email: 'crew_seojun@crewlink.kr',
    password: 'CrewLink2026!crew-2',
    role: 'crew',
  },
  'crew_jiwon@crewlink.kr': {
    email: 'crew_jiwon@crewlink.kr',
    password: 'CrewLink2026!crew-3',
    role: 'crew',
  },
  'crew_minho@crewlink.kr': {
    email: 'crew_minho@crewlink.kr',
    password: 'CrewLink2026!crew-4',
    role: 'crew',
  },
};

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let requestedRole = searchParams.get('role');
    let requestedEmail = searchParams.get('email');

    try {
      const body = await request.clone().json();
      if (body?.role) requestedRole = body.role;
      if (body?.email) requestedEmail = body.email;
    } catch {
      // no body
    }

    // Select account from registered demo accounts
    let targetAccount = requestedEmail ? DEMO_ACCOUNTS[requestedEmail] : null;

    if (!targetAccount) {
      if (requestedRole === 'client') {
        targetAccount = DEMO_ACCOUNTS['client_metaverse@crewlink.kr'];
      } else {
        targetAccount = DEMO_ACCOUNTS['crew_doyoon@crewlink.kr'];
      }
    }

    if (!targetAccount) {
      return NextResponse.json({ message: '허용되지 않은 데모 계정입니다.' }, { status: 400 });
    }

    // 1. Authenticate session with Supabase Auth
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
      .select('id, full_name, display_name')
      .eq('auth_user_id', signInData.user.id)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      user: {
        id: signInData.user.id,
        email: targetAccount.email,
        fullName: person?.full_name || person?.display_name || targetAccount.email,
        personId: person?.id || null,
        role: targetAccount.role,
      },
      session: signInData.session,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '데모 로그인 중 오류가 발생했습니다.';
    console.error('[demo-login] error:', err);
    return NextResponse.json({ message }, { status: 500 });
  }
}
