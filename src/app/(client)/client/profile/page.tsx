'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/common/AppShell';
import { Building, ShieldCheck, Mail, AlertCircle, Loader2 } from 'lucide-react';

interface ClientUser {
  fullName: string;
  email?: string;
  organization?: {
    id: string;
    name: string;
    isVerified: boolean;
    businessRegistrationNumber: string;
  } | null;
}

export default function ClientProfilePage() {
  const [user, setUser] = useState<ClientUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadClientProfile() {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setUser(data.user);
          }
        }
      } catch (err) {
        console.error('Failed to load client profile:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadClientProfile();
  }, []);

  return (
    <AppShell initialRole="client">
      <div className="max-w-2xl mx-auto px-4 py-6 w-full space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-ink">우리 회사</h1>
          <p className="text-xs text-muted mt-0.5">회사 정보와 증빙 받을 이메일을 확인해요.</p>
        </div>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-muted gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-brand" />
            <span className="text-xs">회사 정보를 불러오는 중...</span>
          </div>
        ) : !user?.organization ? (
          <div className="bg-surface border border-border rounded-xl p-6 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
            <h2 className="font-bold text-sm text-ink">연결된 주최사 조직이 없어요</h2>
            <p className="text-xs text-muted">
              상단 계정 메뉴에서 주최사 테스트 계정을 선택해 주세요.
            </p>
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-ink text-inverse flex items-center justify-center font-bold text-lg">
                <Building className="w-6 h-6 text-brand-strong" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-base text-ink">{user.organization.name}</h2>
                  {user.organization.isVerified && (
                    <span className="text-[11px] font-bold text-brand-strong bg-brand-subtle border border-brand-border px-2 py-0.5 rounded-full">
                      사업자 확인
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted">
                  사업자등록번호 · {user.organization.businessRegistrationNumber}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-border-subtle grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted block">담당자 (대표)</span>
                <span className="font-semibold text-ink">{user.fullName}</span>
              </div>
              <div>
                <span className="text-muted block">증빙 받을 이메일</span>
                <span className="font-semibold text-ink">{user.email || '미등록'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
