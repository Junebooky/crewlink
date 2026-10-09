'use client';

import React from 'react';
import { AppShell } from '@/components/common/AppShell';
import { User, Shield, CreditCard, Lock, CheckCircle, Smartphone } from 'lucide-react';

export default function CrewProfilePage() {
  return (
    <AppShell initialRole="crew">
      <div className="max-w-xl mx-auto px-4 py-5 w-full space-y-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">내 프로필 & 정보</h1>
          <p className="text-xs text-slate-500 mt-0.5">민감 개인정보 및 정산 계좌 보호 상태</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#1E60F3] text-white flex items-center justify-center font-bold text-lg">
              김
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900">김크루</h2>
              <p className="text-xs text-slate-500">크루링크 공인 스태프 • 총 18회 과업 완료</p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block">선호 유니폼 규격</span>
              <span className="font-semibold text-slate-800">L (100)</span>
            </div>
            <div>
              <span className="text-slate-400 block">평점</span>
              <span className="font-semibold text-slate-800">★ 4.95 / 5.0</span>
            </div>
          </div>
        </div>

        {/* Privacy Separation Card (Rule #3 Non-negotiable) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-800">
            <Lock className="w-4 h-4 text-[#1E60F3]" />
            <span>개인정보 분리 보관 및 세무 테크 연동</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg flex justify-between items-center">
              <div>
                <span className="text-slate-400 block">세무 테크 식별자</span>
                <span className="font-mono font-medium text-slate-700">tax_key_****8920</span>
              </div>
              <span className="text-[11px] font-semibold text-[#08734E] bg-[#E7F5EE] px-2 py-0.5 rounded">
                주민번호 미보관 안전
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg flex justify-between items-center">
              <div>
                <span className="text-slate-400 block">정산 입금 계좌</span>
                <span className="font-medium text-slate-700">국민은행 (312-****-****-01)</span>
              </div>
              <span className="text-[11px] font-semibold text-[#08734E] bg-[#E7F5EE] px-2 py-0.5 rounded">
                토큰화 분리
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
            * 크루링크는 주민등록번호 원문을 데이터베이스에 일체 보관하지 않으며, 안전한 원천세 연동 식별자만을 활용합니다.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
