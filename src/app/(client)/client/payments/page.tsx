'use client';

import React from 'react';
import { AppShell } from '@/components/common/AppShell';
import { Receipt, CreditCard, Download, CheckCircle2 } from 'lucide-react';

export default function ClientPaymentsPage() {
  const payments = [
    {
      id: 'ord-2026-001',
      projectName: '2026 서울 모빌리티 엑스포 현장 운영',
      amountWon: 809600,
      paidAt: '2026-10-05',
      method: '법인카드 · 토스페이먼츠',
      status: '결제 완료 · 증빙 확인',
    },
  ];

  return (
    <AppShell initialRole="client">
      <div className="max-w-4xl mx-auto px-4 py-6 w-full space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-ink">결제 내역</h1>
          <p className="text-xs text-muted mt-0.5">결제한 행사와 증빙을 한곳에서 확인해요.</p>
        </div>

        <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-canvas border-b border-border text-muted font-semibold">
              <tr>
                <th className="p-3.5">행사</th>
                <th className="p-3.5">결제 금액</th>
                <th className="p-3.5">결제일</th>
                <th className="p-3.5">결제 수단</th>
                <th className="p-3.5">상태</th>
                <th className="p-3.5 text-right">증빙</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-muted">
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="p-3.5 font-bold text-ink">{p.projectName}</td>
                  <td className="p-3.5 font-semibold text-ink tabular-nums">
                    {p.amountWon.toLocaleString()}원
                  </td>
                  <td className="p-3.5 tabular-nums">{p.paidAt}</td>
                  <td className="p-3.5">{p.method}</td>
                  <td className="p-3.5 text-brand-strong font-medium">{p.status}</td>
                  <td className="p-3.5 text-right">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 px-2.5 py-1 border border-border rounded-lg hover:bg-canvas font-medium text-ink"
                    >
                      <Download className="w-3.5 h-3.5" />
                      세금계산서 받기
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
