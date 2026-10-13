'use client';

import React from 'react';
import { AppShell } from '@/components/common/AppShell';
import { Receipt, CreditCard, Download, CheckCircle2 } from 'lucide-react';

export default function ClientPaymentsPage() {
  // Real payments list from DB (empty in MVP demo)
  const payments: Array<{
    id: string;
    projectName: string;
    amountWon: number;
    paidAt: string;
    method: string;
    status: string;
  }> = [];

  return (
    <AppShell initialRole="client">
      <div className="max-w-4xl mx-auto px-4 py-6 w-full space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-ink">결제 내역</h1>
          <p className="text-xs text-muted mt-0.5">결제한 행사와 증빙을 한곳에서 확인해요.</p>
        </div>

        {payments.length === 0 ? (
          <div className="bg-surface border border-border rounded-2xl p-12 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-sm text-ink">아직 결제 내역이 없어요</p>
              <p className="text-xs text-muted mt-1">
                행사 크루 선발 및 확정 후 결제 내역과 전자세금계산서가 발행돼요.
              </p>
            </div>
          </div>
        ) : (
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
        )}
      </div>
    </AppShell>
  );
}
