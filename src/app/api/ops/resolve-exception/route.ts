import { NextResponse } from 'next/server';

// In-memory version registry for tasks
const taskVersionStore = new Map<string, number>([
  ['task-01', 1],
  ['task-02', 1],
  ['task-03', 2],
]);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { taskId, expectedVersion, reason, action } = body;

    if (!taskId || !reason || !reason.trim()) {
      return NextResponse.json(
        { message: '처리 사유(reason) 입력은 필수입니다.' },
        { status: 400 }
      );
    }

    const currentVersion = taskVersionStore.get(taskId) || 1;

    // Concurrency Lock: verify version
    if (expectedVersion !== undefined && expectedVersion !== currentVersion) {
      return NextResponse.json(
        {
          message:
            '선점 충돌: 다른 운영자에 의해 이미 해당 작업의 상태가 변경되었습니다. (Version Conflict)',
        },
        { status: 409 }
      );
    }

    // Bump version upon atomic resolution
    taskVersionStore.set(taskId, currentVersion + 1);

    return NextResponse.json({
      success: true,
      taskId,
      action: action || 'APPROVE',
      newVersion: currentVersion + 1,
      resolvedAt: new Date().toISOString(),
      reason,
    });
  } catch (err: unknown) {
    return NextResponse.json({ message: (err as Error).message }, { status: 400 });
  }
}
