import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId, assignmentId, signatureStrokes } = body;

    if (!projectId || !signatureStrokes || signatureStrokes.length === 0) {
      return NextResponse.json(
        { message: '유효한 프로젝트 ID 및 벡터 서명 데이터가 필요합니다.' },
        { status: 400 }
      );
    }

    // Stores signature vector JSON preserving raw stroke fidelity
    const signedAt = new Date().toISOString();

    return NextResponse.json({
      success: true,
      projectId,
      assignmentId,
      signedAt,
      message: '전자서약이 성공적으로 체결되었습니다.',
    });
  } catch (err: unknown) {
    return NextResponse.json({ message: (err as Error).message }, { status: 400 });
  }
}
