import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedContext, verifyAssignmentOwnership } from '@/lib/auth/serverAuth';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    // 1. Authentication Guard
    const { authContext, errorResponse } = await getAuthenticatedContext(request);
    if (errorResponse) return errorResponse;

    const body = await request.json();
    const { projectId, assignmentId, contractId, signatureStrokes, termsContent } = body;

    if (!signatureStrokes || signatureStrokes.length === 0) {
      return NextResponse.json(
        { message: '유효한 자필 벡터 서명 데이터가 필요합니다.' },
        { status: 400 }
      );
    }

    // 2. Ownership Guard if assignmentId provided
    if (assignmentId) {
      const ownershipError = await verifyAssignmentOwnership(assignmentId, authContext!.personId);
      if (ownershipError) return ownershipError;
    }

    const supabase = await createClient();

    // 3. Resolve contract ID if not passed directly
    let targetContractId = contractId;
    let contractVersion = 'v1.0';
    let contractTerms = termsContent || '표준 SOW 도급 약관 요약: 독립 도급 구조, 근로기준법 제20조 임의 벌금 차감 금지, 3.3% 원천징수.';

    if (!targetContractId && projectId) {
      const { data: contract } = await supabase
        .from('contracts')
        .select('id, terms_content, version')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (contract) {
        targetContractId = contract.id;
        contractTerms = contract.terms_content;
        contractVersion = contract.version || 'v1.0';
      }
    }

    if (!targetContractId) {
      // Fallback: look up the seeded default contract
      const { data: defaultContract } = await supabase
        .from('contracts')
        .select('id, terms_content, version')
        .limit(1)
        .maybeSingle();

      targetContractId = defaultContract?.id || 'ffffffff-ffff-ffff-ffff-ffffffffffff';
      contractTerms = defaultContract?.terms_content || contractTerms;
    }

    // 4. Calculate SHA-256 hash of terms content for legal tamper-proofing
    const termsSha256 = crypto
      .createHash('sha256')
      .update(contractTerms)
      .digest('hex');

    const signedAt = new Date().toISOString();
    const clientIp = request.headers.get('x-forwarded-for') || '127.0.0.1';

    // 5. Insert into Supabase contract_signatures table
    const { data: signatureRecord, error: insertError } = await supabase
      .from('contract_signatures')
      .upsert(
        {
          contract_id: targetContractId,
          signer_person_id: authContext!.personId,
          signature_vector_json: signatureStrokes,
          terms_sha256: termsSha256,
          contract_version: contractVersion,
          signed_ip: clientIp,
          signed_at: signedAt,
        },
        { onConflict: 'contract_id,signer_person_id' }
      )
      .select('id, signed_at')
      .single();

    if (insertError) {
      throw new Error(`전자서약 저장 실패: ${insertError.message}`);
    }

    return NextResponse.json({
      success: true,
      signatureId: signatureRecord.id,
      contractId: targetContractId,
      signerPersonId: authContext!.personId,
      termsSha256,
      contractVersion,
      signedAt,
      message: '전자서약이 성공적으로 체결 및 저장되었습니다.',
    });
  } catch (err: unknown) {
    return NextResponse.json({ message: (err as Error).message }, { status: 400 });
  }
}
