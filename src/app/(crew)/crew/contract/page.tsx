'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/common/AppShell';
import { SignatureCapture, SignatureStroke } from '@/components/common/SignatureCapture';
import {
  FileText,
  ShieldCheck,
  CheckSquare,
  ArrowLeft,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CrewContractPage() {
  const router = useRouter();
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [strokes, setStrokes] = useState<SignatureStroke[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [signedSuccess, setSignedSuccess] = useState(false);

  const canSubmit = agreeTerms && agreePrivacy && strokes.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/crew/sign-contract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-actor-person-id': '11111111-1111-1111-1111-111111111111',
        },
        body: JSON.stringify({
          projectId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          assignmentId: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
          contractId: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
          signatureStrokes: strokes,
          termsContent:
            '표준 SOW 도급 약관 요약: 독립 도급 구조, 근로기준법 제20조 임의 벌금 차감 금지, 3.3% 원천징수.',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || '전자서약 제출에 실패했습니다.');
      }

      setSignedSuccess(true);
    } catch (err: unknown) {
      setErrorMsg((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell initialRole="crew">
      <div className="max-w-xl mx-auto px-4 py-5 w-full space-y-5 pb-24">
        <div className="flex items-center justify-between">
          <Link href="/crew" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800">
            <ArrowLeft className="w-4 h-4" />
            <span>오늘 일정으로</span>
          </Link>
          <span className="text-xs font-semibold text-slate-500">C03 현장 전자서약</span>
        </div>

        {signedSuccess ? (
          <div className="bg-white border border-[#B6E6CE] rounded-2xl p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#E7F5EE] text-[#08734E] mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <span className="px-3 py-1 bg-[#E7F5EE] text-[#08734E] text-xs font-bold rounded-full">
                서약 완료
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-2">전자서약서가 체결되었습니다</h2>
              <p className="text-xs text-slate-500 mt-1">
                서명 벡터 데이터 및 타임스탬프가 무결성 해시와 함께 DB에 영구 보존되었습니다.
              </p>
            </div>
            <Link
              href="/crew"
              className="flex items-center justify-center w-full min-h-[52px] bg-[#1E60F3] text-white rounded-xl font-bold text-sm hover:bg-[#164BC4] transition-colors"
            >
              오늘 일정 화면으로 이동
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900">현장 과업 도급 전자서약서</h1>
              <p className="text-xs text-slate-500 mt-1">
                공정 도급 구조 및 안전 준수를 위해 내용을 확인하고 자필 서명해 주세요.
              </p>
            </div>

            {/* Terms Summary Box */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-xs space-y-3 leading-relaxed text-slate-700 max-h-56 overflow-y-auto">
              <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#1E60F3]" />
                과업지시서(SOW) 주요 조항 요약
              </div>
              <p>
                <strong>제1조 (과업의 목적 및 범위):</strong> 본 계약은 행사장의 원활한 안내 및 현장 지원을
                위한 독립 도급 계약이며, 수임인은 지정된 과업 범위 내에서 자율성과 성실의 원칙에 따라 과업을 수행합니다.
              </p>
              <p>
                <strong>제2조 (보수의 지급 및 세무 원천징수):</strong> 지급 보수는 시간당 15,000원 기준으로
                계산되며, 소득세법에 따라 인적용역 사업소득세 3% 및 지방소득세 0.3%(총 3.3%, 10원 미만 절사)를
                원천징수한 실수령액을 지급기일에 지정 계좌로 송금합니다.
              </p>
              <p>
                <strong>제3조 (임의 벌금 차감 금지):</strong> 플랫폼과 발주사는 근로기준법 제20조 및 관련
                법령에 따라 노쇼·지각 등에 대해 사전에 위약금이나 벌금을 일률 공제하지 않습니다.
              </p>
              <p>
                <strong>제4조 (안전 및 사고 예방):</strong> 현장 운영자의 안전 지침을 성실히 준수하며 비상 시
                즉각 보고합니다.
              </p>
            </div>

            {/* Checkboxes with min 44px tap targets */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs font-semibold text-slate-800 p-1">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#1E60F3] border-slate-300 focus:ring-[#1E60F3]"
                />
                <span>[필수] 과업지시서(SOW)에 명시된 업무 범위 및 안전 수칙을 준수함에 동의합니다.</span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer text-xs font-semibold text-slate-800 p-1">
                <input
                  type="checkbox"
                  checked={agreePrivacy}
                  onChange={(e) => setAgreePrivacy(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#1E60F3] border-slate-300 focus:ring-[#1E60F3]"
                />
                <span>
                  [필수] 개인정보 처리방침 및 원천징수 세무 신고 관련 개인 식별자(tax_provider_user_key) 처리에 동의합니다.
                </span>
              </label>
            </div>

            {/* Signature Capture Canvas */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <SignatureCapture
                value={strokes}
                onChange={setStrokes}
                height={160}
              />
            </div>

            {errorMsg && (
              <div className="p-3 bg-[#FFF0F3] border border-[#FDC4D0] rounded-xl text-[#BB2449] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Polished Button: "동의하고 서명하기", min-h-[52px] */}
            <button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className={cn(
                'w-full min-h-[52px] rounded-xl bg-[#1E60F3] hover:bg-[#164BC4] text-white font-bold text-sm',
                'flex items-center justify-center gap-2 shadow-sm transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <ShieldCheck className="w-5 h-5" />
              <span>{isSubmitting ? '서약서 등록 중...' : '동의하고 서명하기'}</span>
            </button>
          </form>
        )}
      </div>
    </AppShell>
  );
}
