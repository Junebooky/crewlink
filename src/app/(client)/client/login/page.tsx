'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Building2, Mail, Lock, Loader2, Sparkles, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ClientLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 일반 기업 계정 로그인
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMessage('기업 이메일과 비밀번호를 모두 입력해 주세요.');
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

      if (typeof window !== 'undefined') {
        localStorage.removeItem('crewlink_logged_out');
        localStorage.setItem('crewlink_active_role', 'client');
        window.dispatchEvent(new CustomEvent('crewlink:auth-changed'));
      }
      router.push('/client');
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || '로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 개발/테스트용 원클릭 데모 주최사((주)네온패밀리) 1초 로그인
  const handleDemoClientLogin = async () => {
    setErrorMessage(null);
    setIsDemoLoading(true);

    try {
      // 1. 서버 부트스트랩 API 호출 (role=client)
      const res = await fetch('/api/auth/demo-login?role=client', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || '데모 주최사 로그인에 실패했습니다.');
      }

      // 2. 브라우저 Supabase 클라이언트 세션 동기화
      const supabase = createClient();
      await supabase.auth.signInWithPassword({
        email: 'client@crewlink.kr',
        password: 'crewlink2026!',
      });

      if (typeof window !== 'undefined') {
        localStorage.removeItem('crewlink_logged_out');
        localStorage.setItem('crewlink_active_role', 'client');
        window.dispatchEvent(new CustomEvent('crewlink:auth-changed'));
      }

      router.push('/client');
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || '데모 로그인 중 오류가 발생했습니다.');
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        <Link href="/" className="inline-flex items-center gap-2 group mb-4">
          <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-xs group-hover:scale-105 transition-transform shrink-0">
            <Image
              src="/crewlink_app_icon.png"
              alt="CrewLink Logo"
              width={40}
              height={40}
              className="w-full h-full object-cover"
              priority
            />
          </div>
          <span className="font-extrabold text-2xl text-ink tracking-tight">CrewLink</span>
        </Link>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-soft text-brand-strong text-xs font-bold mb-3 border border-brand/20">
          <Building2 className="w-3.5 h-3.5" />
          <span>주최사 비즈니스 전용</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight mb-2">
          주최사로 시작하기
        </h1>
        <p className="text-sm sm:text-base text-muted max-w-sm mx-auto leading-relaxed">
          신뢰할 수 있는 현장 크루를 가장 빠르게 매칭해 드려요.
        </p>
      </div>

      {/* Main Form Container */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-surface py-8 px-6 sm:px-10 shadow-xl shadow-black/5 rounded-3xl border border-border">
          {/* Error Message Alert */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-danger-soft border border-danger/20 text-danger text-sm font-semibold flex items-center gap-2">
              <span className="shrink-0">⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 원클릭 테스트 주최사 로그인 버튼 (최상단 강조) */}
          <div className="mb-6">
            <button
              type="button"
              onClick={handleDemoClientLogin}
              disabled={isDemoLoading || isLoading}
              className="w-full relative group overflow-hidden rounded-2xl bg-gradient-to-r from-brand to-brand-hover p-4 text-white font-bold text-sm shadow-md shadow-brand/20 hover:shadow-lg hover:shadow-brand/30 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  {isDemoLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  )}
                </div>
                <div className="text-left">
                  <div className="text-xs text-white/80 font-medium">테스트 주최사 계정</div>
                  <div className="text-sm font-extrabold">(주)네온패밀리 1초 로그인</div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-white/80 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-border-subtle" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-surface px-3 text-muted font-medium">또는 기업 이메일로 로그인</span>
            </div>
          </div>

          {/* Corporate Email / Password Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">
                기업 이메일
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="biz@company.com"
                  required
                  disabled={isLoading || isDemoLoading}
                  className="w-full pl-10 pr-4 py-3 bg-canvas border border-border rounded-xl text-sm font-medium text-ink placeholder:text-muted/60 focus:outline-hidden focus:ring-2 focus:ring-brand focus:border-brand transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">
                비밀번호
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isLoading || isDemoLoading}
                  className="w-full pl-10 pr-4 py-3 bg-canvas border border-border rounded-xl text-sm font-medium text-ink placeholder:text-muted/60 focus:outline-hidden focus:ring-2 focus:ring-brand focus:border-brand transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || isDemoLoading}
              className="w-full mt-2 py-3.5 px-4 rounded-xl bg-ink text-inverse hover:bg-ink/90 active:scale-[0.99] font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>로그인 중...</span>
                </>
              ) : (
                <span>로그인하기</span>
              )}
            </button>
          </form>

          {/* Benefits summary */}
          <div className="mt-8 pt-6 border-t border-border-subtle space-y-2.5">
            <div className="flex items-center gap-2 text-xs text-muted">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>검증된 상반신 비주얼 프로필 & 신체 스펙 열람</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>실시간 지원자 심사 및 1초 원클릭 선발</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted">
              <ShieldCheck className="w-4 h-4 text-brand shrink-0" />
              <span>노쇼 보증금 안심 관리 및 현장 출퇴근 트래킹</span>
            </div>
          </div>
        </div>

        {/* Footer Link */}
        <div className="mt-6 text-center text-xs text-muted">
          <span>현장 스태프/크루로 참여하고 싶으신가요? </span>
          <Link href="/" className="font-bold text-brand hover:underline">
            크루 홈으로 가기
          </Link>
        </div>
      </div>
    </div>
  );
}
