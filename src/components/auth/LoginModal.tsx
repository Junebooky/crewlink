'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Mail, Lock, Loader2, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

export interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectTo?: string;
  onSuccess?: () => void;
}

export function LoginModal({
  isOpen,
  onClose,
  redirectTo = '/crew',
  onSuccess,
}: LoginModalProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 일반 이메일/비밀번호 로그인
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMessage('이메일과 비밀번호를 모두 입력해 주세요.');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error || !data.session) {
        setErrorMessage(
          error?.message === 'Invalid login credentials'
            ? '이메일 또는 비밀번호가 올바르지 않습니다.'
            : error?.message || '로그인에 실패했습니다. 다시 시도해 주세요.'
        );
        return;
      }

      // 로그인 성공 처리
      onClose();
      if (onSuccess) {
        onSuccess();
      }
      router.push(redirectTo);
      router.refresh();
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || '로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 개발/테스트용 원클릭 데모 크루 로그인
  const handleDemoLogin = async () => {
    setErrorMessage(null);
    setIsDemoLoading(true);

    try {
      // 1. 서버 부트스트랩 API 호출 (계정 미존재 시 자동 생성 및 세션 쿠키 설정)
      const res = await fetch('/api/auth/demo-login', {
        method: 'POST',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || '데모 로그인에 실패했습니다.');
      }

      // 2. 브라우저 Supabase 클라이언트 세션 동기화 (onAuthStateChange 트리거)
      const supabase = createClient();
      await supabase.auth.signInWithPassword({
        email: 'crew@crewlink.kr',
        password: 'crewlink2026!',
      });

      // 로그인 완료
      onClose();
      if (onSuccess) {
        onSuccess();
      }
      router.push(redirectTo);
      router.refresh();
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || '데모 로그인 중 오류가 발생했습니다.');
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        {/* Backdrop overlay */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in" />

        {/* Toss-style Mobile-First Dialog */}
        <Dialog.Content className="fixed z-50 top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-[420px] max-h-[90vh] overflow-y-auto rounded-3xl bg-white border border-border-subtle p-6 sm:p-7 shadow-2xl focus:outline-none animate-in zoom-in-95 duration-200 scrollbar-none">
          {/* Close button */}
          <Dialog.Close asChild>
            <button
              type="button"
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-surface-muted hover:bg-border/60 text-muted hover:text-ink flex items-center justify-center transition-colors cursor-pointer"
              aria-label="닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </Dialog.Close>

          {/* Header */}
          <div className="space-y-1.5 pr-6">
            <Dialog.Title className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight">
              크루링크 시작하기
            </Dialog.Title>
            <Dialog.Description className="text-xs sm:text-sm text-muted break-keep leading-relaxed">
              행사와 크루를 가장 빠르고 안전하게 잇습니다.
            </Dialog.Description>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mt-4 p-3.5 rounded-2xl bg-danger-soft/30 border border-danger/20 text-danger text-xs font-medium flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleEmailLogin} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="text-xs font-bold text-ink">
                이메일
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full h-12 pl-10 pr-4 rounded-xl border border-border bg-white text-ink text-sm font-medium focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="text-xs font-bold text-ink">
                  비밀번호
                </label>
                <button
                  type="button"
                  onClick={() => alert('비밀번호 재설정 링크는 고객센터(support@crewlink.kr)로 문의해 주세요.')}
                  className="text-[11px] text-muted hover:text-brand font-medium transition-colors cursor-pointer"
                >
                  비밀번호 찾기
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력해 주세요"
                  className="w-full h-12 pl-10 pr-4 rounded-xl border border-border bg-white text-ink text-sm font-medium focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
                />
              </div>
            </div>

            {/* Email Login Submit */}
            <button
              type="submit"
              disabled={isLoading || isDemoLoading}
              className="w-full h-12 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-sm shadow-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>로그인하는 중…</span>
                </>
              ) : (
                <span>로그인</span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-subtle" />
            </div>
            <span className="relative bg-white px-3 text-[11px] font-bold text-muted uppercase tracking-wider">
              빠른 테스트
            </span>
          </div>

          {/* Dev/Demo 1-Sec Login Button */}
          <div className="space-y-2">
            <button
              type="button"
              disabled={isLoading || isDemoLoading}
              onClick={handleDemoLogin}
              className="w-full h-12 rounded-xl bg-brand-soft hover:bg-brand-subtle text-brand-strong border border-brand-border font-bold text-xs sm:text-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer shadow-2xs disabled:opacity-50"
            >
              {isDemoLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-brand" />
                  <span>테스트 세션 발급 중…</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-brand" />
                  <span>테스트 크루로 1초 로그인</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-muted text-center">
              계정 입력 없이 즉시 검증할 수 있는 개발용 간편 로그인
            </p>
          </div>

          {/* Bottom Footer Links */}
          <div className="mt-6 pt-4 border-t border-border-subtle text-center text-xs text-muted">
            <span>아직 회원이 아니신가요? </span>
            <button
              type="button"
              onClick={() => {
                onClose();
                router.push('/guide');
              }}
              className="font-bold text-brand hover:text-brand-hover hover:underline inline-flex items-center gap-0.5 cursor-pointer"
            >
              <span>크루 이용안내 보기</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
