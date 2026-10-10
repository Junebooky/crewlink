'use client';

import React from 'react';
import Link from 'next/link';
import { Bookmark, ArrowLeft, Sparkles } from 'lucide-react';
import { PublicHeader } from '@/components/common/PublicHeader';
import { MobileBottomNav } from '@/components/common/MobileBottomNav';

export default function SavedEventsPage() {
  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col pb-20 md:pb-12">
      <PublicHeader />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 flex-1 w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-brand-soft text-brand-strong mx-auto flex items-center justify-center">
          <Bookmark className="w-8 h-8 text-brand" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-xl sm:text-2xl font-black text-ink">저장한 현장 공고</h1>
          <p className="text-xs sm:text-sm text-muted">
            관심 있는 공고를 저장해 두고 마감 전에 빠르게 지원해 보세요.
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-surface border border-border shadow-2xs max-w-md mx-auto space-y-4">
          <p className="text-xs text-muted leading-relaxed">
            아직 저장된 공고가 없어요.<br />
            현장 찾기에서 마음에 드는 팝업·박람회 공고를 확인해 보세요!
          </p>
          <Link
            href="/"
            className="inline-flex min-h-[44px] px-5 rounded-xl bg-brand hover:bg-brand-hover text-inverse text-xs font-bold items-center gap-1.5 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>현장 둘러보기</span>
          </Link>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
