'use client';

import React from 'react';
import { AppShell } from '@/components/common/AppShell';
import { User, Shield, CreditCard, Lock, CheckCircle, Smartphone } from 'lucide-react';

export default function CrewProfilePage() {
  return (
    <AppShell initialRole="crew">
      <div className="max-w-xl mx-auto px-4 py-5 w-full space-y-4">
        <div>
          <h1 className="text-xl font-bold text-ink">내 정보</h1>
          <p className="text-xs text-muted mt-0.5">프로필과 지급 계좌를 확인해요.</p>
        </div>

        {/* Profile Card */}
        <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-brand text-inverse flex items-center justify-center font-bold text-lg">
              김
            </div>
            <div>
              <h2 className="font-bold text-base text-ink">김크루</h2>
              <p className="text-xs text-muted">함께한 현장 18회</p>
            </div>
          </div>

          <div className="pt-3 border-t border-border-subtle grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-muted block">유니폼 사이즈</span>
              <span className="font-semibold text-ink">L (100)</span>
            </div>
            <div>
              <span className="text-muted block">평점</span>
              <span className="font-semibold text-ink">★ 4.95 / 5.0</span>
            </div>
          </div>
        </div>

        {/* Privacy Separation Card */}
        <div className="bg-surface border border-border rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm text-ink">
            <Lock className="w-4 h-4 text-brand" />
            <span>개인정보와 지급 정보</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 bg-canvas rounded-lg flex justify-between items-center">
              <div>
                <span className="text-muted block">세무 정보</span>
                <span className="font-mono font-medium text-muted">확인 필요</span>
              </div>
              <span className="text-[11px] font-semibold text-muted bg-surface-muted px-2 py-0.5 rounded">
                원문 미보관
              </span>
            </div>

            <div className="p-3 bg-canvas rounded-lg flex justify-between items-center">
              <div>
                <span className="text-muted block">지급 계좌</span>
                <span className="font-medium text-muted">국민은행 · 312-****-****-01</span>
              </div>
              <span className="text-[11px] font-semibold text-muted bg-surface-muted px-2 py-0.5 rounded">
                일부 가림
              </span>
            </div>
          </div>

          <p className="text-[11px] text-muted leading-relaxed pt-1">
            주민등록번호 원문 대신 세무 서비스의 식별 정보를 사용해요. 자세한 내용은 개인정보 처리방침에서 확인해 주세요.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
