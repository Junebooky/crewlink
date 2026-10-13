'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import {
  X,
  Search,
  Check,
  Loader2,
  Building,
  User,
  Sparkles,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

export interface AccountSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: 'crew' | 'client';
  currentPersonId?: string | null;
  currentEmail?: string | null;
  onSuccess?: () => void;
}

interface CrewAccount {
  id: string;
  email: string;
  name: string;
  role: 'crew';
  profileImageUrl?: string | null;
  summary: string;
  tags: string[];
}

interface ClientAccount {
  id: string;
  email: string;
  name: string;
  organizationName: string;
  organizationId?: string | null;
  role: 'client';
  isVerified: boolean;
  eventCount: number;
}

type AccountItem = CrewAccount | ClientAccount;

export function AccountSwitcherModal({
  isOpen,
  onClose,
  role,
  currentPersonId,
  currentEmail,
  onSuccess,
}: AccountSwitcherModalProps) {
  const router = useRouter();
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [switchingToName, setSwitchingToName] = useState<string | null>(null);
  const [switchError, setSwitchError] = useState<string | null>(null);

  // Fetch registered demo accounts when modal opens or role changes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSwitchingToName(null);
      setSwitchError(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setFetchError(null);

    async function fetchAccounts() {
      try {
        const res = await fetch(`/api/mvp/accounts?role=${role}`, {
          cache: 'no-store',
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || '계정 목록을 불러오지 못했습니다.');
        }
        if (isMounted) {
          setAccounts(data.accounts || []);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setFetchError((err as Error).message || '네트워크 오류가 발생했습니다.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchAccounts();

    return () => {
      isMounted = false;
    };
  }, [isOpen, role]);

  // Filter accounts by search query
  const filteredAccounts = useMemo(() => {
    if (!searchQuery.trim()) return accounts;
    const query = searchQuery.trim().toLowerCase();
    return accounts.filter((item) => {
      if (role === 'crew') {
        const crew = item as CrewAccount;
        return (
          crew.name.toLowerCase().includes(query) ||
          crew.email.toLowerCase().includes(query) ||
          crew.summary.toLowerCase().includes(query) ||
          crew.tags.some((t) => t.toLowerCase().includes(query))
        );
      } else {
        const host = item as ClientAccount;
        return (
          host.organizationName.toLowerCase().includes(query) ||
          host.name.toLowerCase().includes(query) ||
          host.email.toLowerCase().includes(query)
        );
      }
    });
  }, [accounts, searchQuery, role]);

  // Execute account switch
  const handleSelectAccount = async (account: AccountItem) => {
    if (switchingToName) return;

    // Check if already this account
    const isCurrent =
      (currentPersonId && account.id === currentPersonId) ||
      (currentEmail && account.email.toLowerCase() === currentEmail.toLowerCase());

    if (isCurrent) {
      onClose();
      return;
    }

    setSwitchingToName(account.name);
    setSwitchError(null);

    try {
      const res = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId: account.id,
          email: account.email,
          role: account.role,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || '계정 전환에 실패했습니다.');
      }

      // Sync browser Supabase client
      if (data.session) {
        const supabase = createClient();
        await supabase.auth.setSession(data.session);
      }

      if (typeof window !== 'undefined') {
        localStorage.removeItem('crewlink_logged_out');
        localStorage.setItem('crewlink_active_role', role);
        window.dispatchEvent(new CustomEvent('crewlink:auth-changed'));
      }

      onClose();
      if (onSuccess) onSuccess();

      const targetPath = data.redirectUrl || (role === 'client' ? '/client' : '/crew/schedule');
      window.location.href = targetPath;
    } catch (err: unknown) {
      setSwitchError((err as Error).message || '계정 전환 중 오류가 발생했습니다.');
      setSwitchingToName(null);
    }
  };

  const title = role === 'crew' ? '어떤 크루로 둘러볼까요?' : '어떤 주최사로 둘러볼까요?';

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && !switchingToName && onClose()}>
      <Dialog.Portal>
        {/* Backdrop */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-xs transition-opacity data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Modal Container: Bottom sheet on mobile, centered dialog on desktop */}
        <Dialog.Content
          aria-describedby="account-switcher-desc"
          className={cn(
            'fixed z-50 w-full bg-surface shadow-2xl transition-all duration-200 outline-none flex flex-col',
            // Mobile: Bottom sheet
            'bottom-0 left-0 right-0 rounded-t-3xl max-h-[90vh] sm:bottom-auto sm:left-[50%] sm:top-[50%] sm:max-h-[85vh] sm:w-[94%] sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl border border-border pb-safe',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:slide-out-to-bottom sm:data-[state=closed]:zoom-out-95',
            'data-[state=open]:slide-in-from-bottom sm:data-[state=open]:zoom-in-95'
          )}
        >
          {/* Mobile Drag Indicator */}
          <div className="w-12 h-1.5 bg-neutral-border rounded-full mx-auto mt-3 mb-1 sm:hidden shrink-0" />

          {/* Header */}
          <div className="px-5 pt-4 pb-3 border-b border-border-subtle flex items-start justify-between shrink-0">
            <div>
              <div className="flex items-center gap-1.5 text-brand text-xs font-bold mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>테스트 계정 선택기</span>
              </div>
              <Dialog.Title className="text-lg sm:text-xl font-extrabold text-ink tracking-tight">
                {title}
              </Dialog.Title>
              <p id="account-switcher-desc" className="text-xs text-muted mt-0.5 font-medium">
                테스트 계정을 선택하면 바로 이어져요.
              </p>
            </div>
            <Dialog.Close
              disabled={!!switchingToName}
              className="p-1.5 rounded-full hover:bg-canvas text-muted hover:text-ink transition-colors cursor-pointer shrink-0"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          {/* Search Bar if > 4 accounts */}
          {accounts.length > 4 && (
            <div className="px-5 pt-3 pb-1 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={role === 'crew' ? '크루 이름, 경력, 전문 분야 검색...' : '주최사명, 담당자명 검색...'}
                  className="w-full h-10 pl-9 pr-3 rounded-xl bg-canvas border border-border/80 text-xs text-ink placeholder:text-muted focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>
          )}

          {/* Switch Status / Error Alert */}
          {switchError && (
            <div className="mx-5 my-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs flex items-center gap-2 shrink-0">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{switchError}</span>
            </div>
          )}

          {/* Connecting State Overlay / Banner */}
          {switchingToName && (
            <div className="px-5 py-2.5 bg-brand-soft border-b border-brand-border/40 text-brand-strong text-xs font-bold flex items-center justify-center gap-2 shrink-0 animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-brand" />
              <span>{switchingToName} 계정으로 연결 중...</span>
            </div>
          )}

          {/* Scrollable Accounts List */}
          <div className="p-3 sm:p-5 overflow-y-auto space-y-2 flex-1 max-h-[60vh]">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-muted gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-brand" />
                <span className="text-xs">등록된 테스트 계정을 확인하는 중...</span>
              </div>
            ) : fetchError ? (
              <div className="py-8 text-center text-xs text-error p-4">
                <p>{fetchError}</p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="mt-3 px-3 py-1.5 bg-slate-100 rounded-lg text-slate-700 font-bold"
                >
                  새로고침
                </button>
              </div>
            ) : filteredAccounts.length === 0 ? (
              <div className="py-10 text-center text-xs text-muted">
                {searchQuery ? '검색 결과와 일치하는 계정이 없어요.' : '등록된 테스트 계정이 없습니다.'}
              </div>
            ) : (
              filteredAccounts.map((account) => {
                const isCurrent =
                  (currentPersonId && account.id === currentPersonId) ||
                  (currentEmail && account.email.toLowerCase() === currentEmail.toLowerCase());

                if (role === 'crew') {
                  const crew = account as CrewAccount;
                  return (
                    <button
                      key={crew.id}
                      type="button"
                      disabled={!!switchingToName}
                      onClick={() => handleSelectAccount(crew)}
                      className={cn(
                        'w-full min-h-[58px] p-3 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer group',
                        isCurrent
                          ? 'bg-brand-soft/40 border-brand/40 shadow-xs'
                          : 'bg-surface hover:bg-canvas border-border/80 hover:border-brand/30 shadow-2xs'
                      )}
                    >
                      {/* Avatar & Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative w-10 h-10 rounded-full bg-slate-100 overflow-hidden ring-2 ring-white shrink-0 flex items-center justify-center">
                          {crew.profileImageUrl ? (
                            <Image
                              src={crew.profileImageUrl}
                              alt=""
                              fill
                              unoptimized
                              sizes="40px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-brand-soft text-brand-strong flex items-center justify-center">
                              <User className="w-5 h-5 text-brand" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-ink group-hover:text-brand transition-colors">
                              {crew.name}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-brand text-inverse rounded-md">
                                현재 계정
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted truncate mt-0.5">{crew.summary}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            {crew.tags.slice(0, 2).map((tag, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] font-semibold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Action */}
                      <div className="shrink-0 flex items-center">
                        {isCurrent ? (
                          <div className="w-7 h-7 rounded-full bg-brand/10 text-brand flex items-center justify-center">
                            <Check className="w-4 h-4 font-bold" />
                          </div>
                        ) : (
                          <div className="text-xs font-bold text-muted group-hover:text-brand flex items-center gap-0.5">
                            <span>시작</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                } else {
                  const client = account as ClientAccount;
                  return (
                    <button
                      key={client.id}
                      type="button"
                      disabled={!!switchingToName}
                      onClick={() => handleSelectAccount(client)}
                      className={cn(
                        'w-full min-h-[58px] p-3 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer group',
                        isCurrent
                          ? 'bg-brand-soft/40 border-brand/40 shadow-xs'
                          : 'bg-surface hover:bg-canvas border-border/80 hover:border-brand/30 shadow-2xs'
                      )}
                    >
                      {/* Host Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-ink text-inverse flex items-center justify-center shrink-0">
                          <Building className="w-5 h-5 text-brand-inverse" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm text-ink group-hover:text-brand transition-colors truncate">
                              {client.organizationName}
                            </span>
                            {client.isVerified && (
                              <ShieldCheck className="w-3.5 h-3.5 text-brand shrink-0" />
                            )}
                            {isCurrent && (
                              <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-brand text-inverse rounded-md shrink-0">
                                현재 계정
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted truncate mt-0.5">
                            담당자: {client.name} · {client.email}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-50 text-brand rounded">
                              진행 행사 {client.eventCount}개
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action */}
                      <div className="shrink-0 flex items-center">
                        {isCurrent ? (
                          <div className="w-7 h-7 rounded-full bg-brand/10 text-brand flex items-center justify-center">
                            <Check className="w-4 h-4 font-bold" />
                          </div>
                        ) : (
                          <div className="text-xs font-bold text-muted group-hover:text-brand flex items-center gap-0.5">
                            <span>시작</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                }
              })
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
