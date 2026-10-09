'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/common/AppShell';
import {
  QrCode,
  Camera,
  AlertCircle,
  Clock,
  CheckCircle2,
  HelpCircle,
  ArrowLeft,
  ShieldAlert,
  Send
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CrewCheckinPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'SCANNER' | 'MANUAL_REQUEST' | 'WAITING_OPS' | 'SUCCESS'>('SCANNER');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manualReason, setManualReason] = useState<'CAMERA_PERMISSION_DENIED' | 'QR_SCAN_FAILED'>('QR_SCAN_FAILED');
  const [manualNote, setManualNote] = useState('');
  const [checkinData, setCheckinData] = useState<{ checkedInAt: string; alreadyRecorded: boolean } | null>(null);

  // Simulate scanning a dynamic 60s TTL QR code
  const handleSimulateScan = async (sampleHash: string) => {
    setIsSubmitting(true);
    setCameraError(null);
    try {
      const res = await fetch('/api/crew/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: 'asgn-001',
          tokenHash: sampleHash,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || '출근 인증에 실패했습니다.');
      }
      setCheckinData({
        checkedInAt: data.checkedInAt,
        alreadyRecorded: data.alreadyRecorded,
      });
      setViewMode('SUCCESS');
    } catch (err: unknown) {
      setCameraError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/crew/face-to-face', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: 'asgn-001',
          reason: manualReason,
          note: manualNote,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || '요청 제출에 실패했습니다.');
      }
      // Switch directly to "운영자 확인을 기다려요" standby view
      setViewMode('WAITING_OPS');
    } catch (err: unknown) {
      setCameraError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell initialRole="crew">
      <div className="max-w-md mx-auto px-4 py-5 w-full space-y-5">
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <Link href="/crew" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800">
            <ArrowLeft className="w-4 h-4" />
            <span>오늘 일정으로</span>
          </Link>
          <span className="text-xs font-semibold text-slate-500">C04 현장 출근 인증</span>
        </div>

        {/* 1. SCANNER VIEW */}
        {viewMode === 'SCANNER' && (
          <div className="space-y-4">
            <div className="text-center">
              <h1 className="text-xl font-bold text-slate-900">현장 QR 코드 스캔</h1>
              <p className="text-xs text-slate-500 mt-1">현장 운영 데스크의 60초 가변 QR 코드를 카메라로 인식하세요.</p>
            </div>

            {/* Camera Viewfinder Box */}
            <div className="relative aspect-square w-full bg-slate-900 rounded-2xl overflow-hidden flex flex-col items-center justify-center border-4 border-slate-800 shadow-inner">
              <div className="absolute inset-8 border-2 border-white/60 rounded-xl pointer-events-none flex items-center justify-center">
                <div className="w-full h-0.5 bg-[#1E60F3]/80 animate-pulse" />
              </div>

              <Camera className="w-12 h-12 text-white/40 mb-3" />
              <div className="text-xs text-white/80 font-medium px-4 text-center">
                카메라 렌즈를 QR 코드 중앙에 맞춰주세요.
              </div>

              {/* Simulation Trigger button for quick test in browser */}
              <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleSimulateScan('valid-hash-sample-64-chars-000000000000000000000000000000000000000000')
                  }
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 px-3 bg-[#1E60F3] hover:bg-[#164BC4] text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
                >
                  {isSubmitting ? '인증 처리 중...' : '유효 QR 인식 (테스트)'}
                </button>
              </div>
            </div>

            {cameraError && (
              <div className="p-3 bg-[#FFF0F3] border border-[#FDC4D0] rounded-xl text-[#BB2449] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{cameraError}</span>
              </div>
            )}

            {/* Fallback Branch: [대면 확인 요청] */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <HelpCircle className="w-4 h-4 text-slate-500" />
                <span>카메라 인식이 안 되거나 권한이 차단되었나요?</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                조명이 어둡거나 기기 오류로 인식이 불가능할 경우, 현장 운영자에게 대면 출근 확인을 요청할 수 있습니다.
              </p>
              <button
                type="button"
                onClick={() => setViewMode('MANUAL_REQUEST')}
                className="w-full mt-1 py-2.5 border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-lg transition-colors"
              >
                [대면 확인 요청] 신청하기
              </button>
            </div>
          </div>
        )}

        {/* 2. MANUAL REQUEST FORM */}
        {viewMode === 'MANUAL_REQUEST' && (
          <form onSubmit={handleManualRequest} className="space-y-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900">운영자 대면 확인 요청</h1>
              <p className="text-xs text-slate-500 mt-1">현장 운영자에게 직접 신원 및 도착 확인을 요청합니다.</p>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">인식 불가 사유</label>
                <select
                  value={manualReason}
                  onChange={(e) => setManualReason(e.target.value as 'CAMERA_PERMISSION_DENIED' | 'QR_SCAN_FAILED')}
                  className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1E60F3]"
                >
                  <option value="QR_SCAN_FAILED">QR 코드 스캔 실패 / 초점 인식 불가</option>
                  <option value="CAMERA_PERMISSION_DENIED">카메라 권한 차단됨 / 브라우저 미지원</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">추가 메모 (선택)</label>
                <textarea
                  value={manualNote}
                  onChange={(e) => setManualNote(e.target.value)}
                  placeholder="현장 데스크 위치나 현재 상황을 적어주세요 (예: 3층 D홀 안내데스크 앞 도착)"
                  className="w-full h-20 p-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E60F3]"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setViewMode('SCANNER')}
                className="flex-1 h-11 border border-slate-300 bg-white text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors"
              >
                돌아가기
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 h-11 bg-[#1E60F3] text-white font-bold text-sm rounded-xl hover:bg-[#164BC4] transition-colors flex items-center justify-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? '접수 중...' : '확인 요청 접수'}</span>
              </button>
            </div>
          </form>
        )}

        {/* 3. "운영자 확인을 기다려요" STANDBY VIEW */}
        {viewMode === 'WAITING_OPS' && (
          <div className="bg-white border border-amber-200 rounded-2xl p-6 text-center space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-[#FFF3D9] text-[#895400] mx-auto flex items-center justify-center">
              <Clock className="w-8 h-8" />
            </div>

            <div>
              <span className="inline-block px-3 py-1 bg-[#FFF3D9] text-[#895400] text-xs font-bold rounded-full mb-2">
                운영자 확인 중
              </span>
              <h2 className="text-xl font-bold text-slate-900">&quot;운영자 확인을 기다려요&quot;</h2>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                대면 출근 확인 요청이 운영 관제 데스크에 전달되었습니다.
                <br />
                현장 관리자에게 성함(<strong className="text-slate-800">김크루</strong>)을 말씀해 주시면
                승인 처리됩니다.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs text-slate-600 space-y-1">
              <div>• 요청 일시: {new Date().toLocaleTimeString('ko-KR')}</div>
              <div>• 접수 구분: 대면 수동 확인 큐 (O01 작업함 인계)</div>
            </div>

            <Link
              href="/crew"
              className="block w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors"
            >
              오늘 일정 화면으로 이동
            </Link>
          </div>
        )}

        {/* 4. SUCCESS VIEW */}
        {viewMode === 'SUCCESS' && (
          <div className="bg-white border border-[#B6E6CE] rounded-2xl p-6 text-center space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-[#E7F5EE] text-[#08734E] mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="inline-block px-3 py-1 bg-[#E7F5EE] text-[#08734E] text-xs font-bold rounded-full mb-2">
                {checkinData?.alreadyRecorded ? '기존 완료 확인' : '도착 확인 완료'}
              </span>
              <h2 className="text-xl font-bold text-slate-900">출근이 정상 인증되었습니다</h2>
              <p className="text-xs text-slate-600 mt-2">
                인증 시각: {checkinData?.checkedInAt || new Date().toISOString()}
              </p>
            </div>

            <Link
              href="/crew"
              className="block w-full py-3 bg-[#08734E] text-white rounded-xl font-bold text-sm hover:bg-[#065F40] transition-colors"
            >
              오늘 일정으로 돌아가기
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}
