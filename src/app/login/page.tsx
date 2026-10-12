'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Loader2, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

      router.push('/crew');
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || '로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setErrorMessage(null);
    setIsDemoLoading(true);

    try {
      const res = await fetch('/api/auth/demo-login', {
        method: 'POST',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || '데모 로그인에 실패했습니다.');
      }

      const supabase = createClient();
      await supabase.auth.signInWithPassword({
        email: 'crew@crewlink.kr',
        password: 'crewlink2026!',
      });

      router.push('/crew');
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || '데모 로그인 중 오류가 발생했습니다.');
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-[420px] space-y-6">
        {/* Brand Logo Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 group mb-2">
            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-xs group-hover:scale-105 transition-transform shrink-0">
              <Image
                src="/crewlink_app_icon.png"
                alt="CrewLink Logo"
                width={36}
                height={36}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <span className="font-extrabold text-xl text-ink tracking-tight">CrewLink</span>
          </Link>
          <h1 className="text-2xl font-extrabold text-ink tracking-tight">크루링크 시작하기</h1>
          <p className="text-xs sm:text-sm text-muted break-keep">
            행사와 크루를 가장 빠르고 안전하게 잇습니다.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-border-subtle p-6 sm:p-7 shadow-lg">
          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-2xl bg-danger-soft/30 border border-danger/20 text-danger text-xs font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="login-page-email" className="text-xs font-bold text-ink">
                이메일
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-page-email"
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
                <label htmlFor="login-page-password" className="text-xs font-bold text-ink">
                  비밀번호
                </label>
                <span className="text-[11px] text-muted font-medium">
                  비밀번호 분실 시 고객센터 문의
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-page-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력해 주세요"
                  className="w-full h-12 pl-10 pr-4 rounded-xl border border-border bg-white text-ink text-sm font-medium focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || isDemoLoading}
              className="w-full h-12 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-sm shadow-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
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

          {/* Dev Demo Login Button */}
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

          <div className="mt-6 pt-4 border-t border-border-subtle text-center text-xs text-muted">
            <span>아직 회원이 아니신가요? </span>
            <Link
              href="/guide"
              className="font-bold text-brand hover:text-brand-hover hover:underline inline-flex items-center gap-0.5"
            >
              <span>크루 이용안내 보기</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
