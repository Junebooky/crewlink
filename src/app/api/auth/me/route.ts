import { NextResponse } from 'next/server';
import { getAuthenticatedContext } from '@/lib/auth/serverAuth';

export async function GET(request: Request) {
  try {
    const { authContext, errorResponse } = await getAuthenticatedContext(request);
    if (errorResponse || !authContext) {
      return NextResponse.json({ authenticated: false, roles: [] }, { status: 200 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: authContext.userId,
        personId: authContext.personId,
        fullName: authContext.fullName,
        email: authContext.email,
        roles: authContext.roles,
      },
    });
  } catch {
    return NextResponse.json({ authenticated: false, roles: [] }, { status: 200 });
  }
}
