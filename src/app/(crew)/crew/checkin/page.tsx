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
            '카메라를 켜지 못했어요. 카메라 권한을 허용하거나 운영자에게 도착 확인을 요청해 주세요.'
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
        throw new Error(data.message || '출근을 확인하지 못했어요. QR을 다시 스캔하거나 운영자에게 확인을 요청해 주세요.');
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
        throw new Error(data.message || '확인 요청을 보내지 못했어요. 연결 상태를 확인하고 다시 시도해 주세요.');
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
          <Link href="/crew" className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink">
            <ArrowLeft className="w-4 h-4" />
            <span>오늘로</span>
          </Link>
          <span className="text-xs font-semibold text-muted">도착 확인</span>
        </div>

        {/* 1. REAL QR SCANNER VIEW */}
        {viewMode === 'SCANNER' && (
          <div className="space-y-4">
            <div className="text-center">
              <h1 className="text-xl font-bold text-ink">QR로 도착을 알려주세요</h1>
              <p className="text-xs text-muted mt-1">현장 데스크의 QR을 화면 안에 맞춰주세요.</p>
            </div>

            {/* html5-qrcode Container Box */}
            <div className="relative aspect-square w-full bg-ink rounded-2xl overflow-hidden flex flex-col items-center justify-center border-4 border-border-strong shadow-inner">
              <div id="html5-qr-reader" className="w-full h-full" />

              {!isCameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-ink/90 text-inverse z-10">
                  <Camera className="w-12 h-12 text-inverse/70 mb-3 animate-pulse" />
                  <div className="text-xs font-medium text-inverse-muted">카메라 켜는 중…</div>
                </div>
              )}
            </div>

            {cameraError && (
              <div className="p-3 bg-error-bg border border-error-border rounded-xl text-error text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{cameraError}</span>
              </div>
            )}

            {/* Quick Test / Demo Trigger using seeded valid SHA-256 token */}
            {process.env.NODE_ENV !== 'production' && (
              <div className="p-3 bg-brand-subtle border border-brand-border rounded-xl space-y-1.5">
                <div className="text-[11px] font-bold text-brand flex items-center gap-1">
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>개발용 QR 테스트</span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleCheckinWithToken(
                      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
                    )
                  }
                  disabled={isSubmitting}
                  className="w-full min-h-[52px] bg-brand hover:bg-brand-hover text-inverse text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2"
                >
                  <QrCode className="w-4 h-4" />
                  <span>{isSubmitting ? '도착 확인 중…' : '테스트 QR 확인'}</span>
                </button>
              </div>
            )}

            {/* Fallback Branch: [대면 확인 요청] */}
            <div className="p-4 bg-canvas border border-border rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-muted">
                <HelpCircle className="w-4 h-4 text-muted" />
                <span>QR이 잘 안 읽히나요?</span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                카메라를 사용할 수 없어도 괜찮아요. 현장 운영자에게 도착 확인을 요청해 주세요.
              </p>
              <button
                type="button"
                onClick={() => setViewMode('MANUAL_REQUEST')}
                className="w-full min-h-[52px] border border-border bg-surface hover:bg-surface-muted text-ink text-xs font-semibold rounded-xl transition-colors"
              >
                운영자에게 확인 요청
              </button>
            </div>
          </div>
        )}

        {/* 2. MANUAL REQUEST FORM */}
        {viewMode === 'MANUAL_REQUEST' && (
          <form onSubmit={handleManualRequest} className="space-y-4">
            <div>
              <h1 className="text-xl font-bold text-ink">도착 확인을 요청할까요?</h1>
              <p className="text-xs text-muted mt-1">현장 운영자가 직접 확인할 수 있도록 요청을 보내요.</p>
            </div>

            <div className="p-4 bg-surface border border-border rounded-xl space-y-3">
              <div>
                <label className="text-xs font-bold text-muted block mb-1">어떤 문제가 있나요?</label>
                <select
                  value={manualReason}
                  onChange={(e) => setManualReason(e.target.value as 'CAMERA_PERMISSION_DENIED' | 'QR_SCAN_FAILED')}
                  className="w-full h-11 px-3 border border-border rounded-lg text-sm bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  <option value="QR_SCAN_FAILED">QR이 잘 안 읽혀요</option>
                  <option value="CAMERA_PERMISSION_DENIED">카메라를 사용할 수 없어요</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-muted block mb-1">메모 (선택)</label>
                <textarea
                  value={manualNote}
                  onChange={(e) => setManualNote(e.target.value)}
                  placeholder="예: 코엑스 3층 D홀 안내데스크 앞에 있어요"
                  className="w-full h-24 p-3 border border-border rounded-lg text-sm text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setViewMode('SCANNER')}
                className="flex-1 min-h-[52px] border border-border bg-surface text-muted font-bold text-sm rounded-xl hover:bg-canvas transition-colors"
              >
                이전
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 min-h-[52px] bg-brand text-inverse font-bold text-sm rounded-xl hover:bg-brand-hover transition-colors flex items-center justify-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? '요청 보내는 중…' : '확인 요청 보내기'}</span>
              </button>
            </div>
          </form>
        )}

        {/* 3. "운영자 확인을 기다려요" STANDBY VIEW */}
        {viewMode === 'WAITING_OPS' && (
          <div className="bg-surface border border-neutral-border rounded-2xl p-6 text-center space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-surface-muted text-muted mx-auto flex items-center justify-center">
              <Clock className="w-8 h-8" />
            </div>

            <div>
              <span className="inline-block px-3 py-1 bg-surface-muted text-muted text-xs font-bold rounded-full mb-2">
                확인 대기
              </span>
              <h2 className="text-xl font-bold text-ink">운영자 확인을 기다리고 있어요</h2>
              <p className="text-xs text-muted mt-2 leading-relaxed">
                도착 확인을 요청했어요.
                <br />
                현장 운영자에게 <strong className="text-ink">김크루</strong>님이라고 알려주세요. 운영자가 도착 여부를 확인해요.
              </p>
            </div>

            <div className="p-3 bg-canvas border border-border rounded-xl text-left text-xs text-muted space-y-1">
              <div>• 요청 시간: {new Date().toLocaleTimeString('ko-KR')}</div>
              <div>• 확인 방식: 운영자 대면 확인</div>
            </div>

            <Link
              href="/crew"
              className="flex items-center justify-center w-full min-h-[52px] bg-brand text-inverse rounded-xl font-bold text-sm hover:bg-brand-hover transition-colors"
            >
              오늘로 돌아가기
            </Link>
          </div>
        )}

        {/* 4. SUCCESS VIEW */}
        {viewMode === 'SUCCESS' && (
          <div className="bg-surface border border-brand-border rounded-2xl p-6 text-center space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-brand-soft text-brand-strong mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="inline-block px-3 py-1 bg-brand-soft text-brand-strong text-xs font-bold rounded-full mb-2">
                {checkinData?.alreadyRecorded ? '이미 확인했어요' : '도착 확인'}
              </span>
              <h2 className="text-xl font-bold text-ink">도착 확인을 마쳤어요</h2>
              <p className="text-xs text-muted mt-2">
                확인 시간: {checkinData?.checkedInAt || new Date().toISOString()}
              </p>
            </div>

            <Link
              href="/crew"
              className="flex items-center justify-center w-full min-h-[52px] bg-brand text-inverse rounded-xl font-bold text-sm hover:bg-brand-hover transition-colors"
            >
              오늘로 돌아가기
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}
