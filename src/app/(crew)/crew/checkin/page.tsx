'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/common/AppShell';
import { Html5Qrcode } from 'html5-qrcode';
import {
  QrCode,
  Camera,
  AlertCircle,
  Clock,
  CheckCircle2,
  HelpCircle,
  ArrowLeft,
  ShieldAlert,
  Send,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CrewCheckinPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'SCANNER' | 'MANUAL_REQUEST' | 'WAITING_OPS' | 'SUCCESS'>('SCANNER');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [manualReason, setManualReason] = useState<'CAMERA_PERMISSION_DENIED' | 'QR_SCAN_FAILED'>('QR_SCAN_FAILED');
  const [manualNote, setManualNote] = useState('');
  const [checkinData, setCheckinData] = useState<{ checkedInAt: string; alreadyRecorded: boolean } | null>(null);

  const qrScannerRef = useRef<Html5Qrcode | null>(null);

  // Initialize and run real html5-qrcode video scanner
  useEffect(() => {
    if (viewMode !== 'SCANNER') return;

    let isMounted = true;
    const scannerId = 'html5-qr-reader';

    const startScanner = async () => {
      try {
        setCameraError(null);
        const scanner = new Html5Qrcode(scannerId);
        qrScannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 260, height: 260 },
            aspectRatio: 1.0,
          },
          async (decodedText) => {
            if (!isMounted) return;
            // Successfully decoded real QR code from video stream
            try {
              if (scanner.isScanning) {
                await scanner.stop();
              }
            } catch {
              // ignore stop errors
            }
            handleCheckinWithToken(decodedText);
          },
          () => {
            // Frame scanned without QR: ignore
          }
        );

        if (isMounted) {
          setIsCameraActive(true);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setIsCameraActive(false);
          setCameraError(
            '카메라를 실행할 수 없습니다 (권한 허용 필요 또는 환경 미지원). 아래 [대면 확인 요청]을 이용하실 수 있습니다.'
          );
        }
      }
    };

    // Small delay to ensure DOM element is rendered
    const timer = setTimeout(() => {
      startScanner();
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (qrScannerRef.current && qrScannerRef.current.isScanning) {
        qrScannerRef.current.stop().catch(() => {});
      }
    };
  }, [viewMode]);

  const handleCheckinWithToken = async (tokenHash: string) => {
    setIsSubmitting(true);
    setCameraError(null);
    try {
      const res = await fetch('/api/crew/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-actor-person-id': '11111111-1111-1111-1111-111111111111',
        },
        body: JSON.stringify({
          assignmentId: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
          tokenHash: tokenHash.trim(),
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
        headers: {
          'Content-Type': 'application/json',
          'x-actor-person-id': '11111111-1111-1111-1111-111111111111',
        },
        body: JSON.stringify({
          assignmentId: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
          reason: manualReason,
          note: manualNote,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || '요청 제출에 실패했습니다.');
      }
      setViewMode('WAITING_OPS');
    } catch (err: unknown) {
      setCameraError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell initialRole="crew">
      <div className="max-w-md mx-auto px-4 py-5 w-full space-y-5 pb-24">
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <Link href="/crew" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800">
            <ArrowLeft className="w-4 h-4" />
            <span>오늘 일정으로</span>
          </Link>
          <span className="text-xs font-semibold text-slate-500">C04 현장 출근 인증</span>
        </div>

        {/* 1. REAL QR SCANNER VIEW */}
        {viewMode === 'SCANNER' && (
          <div className="space-y-4">
            <div className="text-center">
              <h1 className="text-xl font-bold text-slate-900">현장 QR 코드 스캔</h1>
              <p className="text-xs text-slate-500 mt-1">현장 운영 데스크의 유효 QR 코드를 카메라로 인식하세요.</p>
            </div>

            {/* html5-qrcode Container Box */}
            <div className="relative aspect-square w-full bg-slate-900 rounded-2xl overflow-hidden flex flex-col items-center justify-center border-4 border-slate-800 shadow-inner">
              <div id="html5-qr-reader" className="w-full h-full" />

              {!isCameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-slate-900/90 text-white z-10">
                  <Camera className="w-12 h-12 text-white/50 mb-3 animate-pulse" />
                  <div className="text-xs font-medium text-slate-300">카메라 스트림을 준비 중입니다...</div>
                </div>
              )}
            </div>

            {cameraError && (
              <div className="p-3 bg-[#FFF0F3] border border-[#FDC4D0] rounded-xl text-[#BB2449] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{cameraError}</span>
              </div>
            )}

            {/* Quick Test / Demo Trigger using seeded valid SHA-256 token */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1.5">
              <div className="text-[11px] font-bold text-[#1E60F3] flex items-center gap-1">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>테스트용 공용 QR 스캔 시뮬레이션</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleCheckinWithToken(
                    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
                  )
                }
                disabled={isSubmitting}
                className="w-full min-h-[52px] bg-[#1E60F3] hover:bg-[#164BC4] text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2"
              >
                <QrCode className="w-4 h-4" />
                <span>{isSubmitting ? '출근 처리 중...' : '유효 QR 즉시 스캔 (테스트)'}</span>
              </button>
            </div>

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
                className="w-full min-h-[52px] border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-xl transition-colors"
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
                  className="w-full h-11 px-3 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1E60F3]"
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
                  className="w-full h-24 p-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E60F3]"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setViewMode('SCANNER')}
                className="flex-1 min-h-[52px] border border-slate-300 bg-white text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors"
              >
                돌아가기
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 min-h-[52px] bg-[#1E60F3] text-white font-bold text-sm rounded-xl hover:bg-[#164BC4] transition-colors flex items-center justify-center gap-1.5"
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
              className="flex items-center justify-center w-full min-h-[52px] bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors"
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
              className="flex items-center justify-center w-full min-h-[52px] bg-[#08734E] text-white rounded-xl font-bold text-sm hover:bg-[#065F40] transition-colors"
            >
              오늘 일정으로 돌아가기
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}
