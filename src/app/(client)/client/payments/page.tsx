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
      method: '토스페이먼츠 법인카드',
      status: '결제 완료 (세금계산서 발행됨)',
    },
  ];

  return (
    <AppShell initialRole="client">
      <div className="max-w-4xl mx-auto px-4 py-6 w-full space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">결제 & 세금계산서 증빙</h1>
          <p className="text-xs text-slate-500 mt-0.5">B2B 결제 승인 내역 및 매입 세금계산서</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
              <tr>
                <th className="p-3.5">주문/행사명</th>
                <th className="p-3.5">결제 금액</th>
                <th className="p-3.5">결제 일자</th>
                <th className="p-3.5">결제 수단</th>
                <th className="p-3.5">상태</th>
                <th className="p-3.5 text-right">증빙 다운로드</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="p-3.5 font-bold text-slate-900">{p.projectName}</td>
                  <td className="p-3.5 font-semibold text-slate-900 tabular-nums">
                    {p.amountWon.toLocaleString()}원
                  </td>
                  <td className="p-3.5 tabular-nums">{p.paidAt}</td>
                  <td className="p-3.5">{p.method}</td>
                  <td className="p-3.5 text-emerald-600 font-medium">{p.status}</td>
                  <td className="p-3.5 text-right">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 px-2.5 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium"
                    >
                      <Download className="w-3.5 h-3.5" />
                      매입 세금계산서
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
