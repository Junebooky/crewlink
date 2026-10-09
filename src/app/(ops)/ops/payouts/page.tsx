'use client';

import React from 'react';
import { AppShell } from '@/components/common/AppShell';
import { DollarSign, CheckCircle2, ShieldCheck, Download } from 'lucide-react';

export default function OpsPayoutsPage() {
  const settlements = [
    {
      id: 'set-001',
      crewName: '김크루',
      project: '2026 서울 모빌리티 엑스포',
      gross: 90000,
      tax: 2970, // 3.3% rounded/floored
      net: 87030,
      status: '지급 준비',
      dueDate: '2026-10-15',
    },
  ];

  return (
    <AppShell initialRole="ops">
      <div className="max-w-5xl mx-auto px-4 py-6 w-full space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-ink">지급 관리</h1>
          <p className="text-xs text-muted mt-0.5">지급할 금액을 확인하고, 처리 결과를 살펴보세요.</p>
        </div>

        <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-canvas border-b border-border text-muted font-semibold">
              <tr>
                <th className="p-3.5">받는 분</th>
                <th className="p-3.5">행사</th>
                <th className="p-3.5">세전 보수</th>
                <th className="p-3.5">원천징수 세액</th>
                <th className="p-3.5">실지급액</th>
                <th className="p-3.5">지급 예정일</th>
                <th className="p-3.5">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-muted">
              {settlements.map((s) => (
                <tr key={s.id}>
                  <td className="p-3.5 font-bold text-ink">{s.crewName}</td>
                  <td className="p-3.5">{s.project}</td>
                  <td className="p-3.5 tabular-nums">{s.gross.toLocaleString()}원</td>
                  <td className="p-3.5 tabular-nums text-ink">-{s.tax.toLocaleString()}원</td>
                  <td className="p-3.5 tabular-nums font-bold text-brand">{s.net.toLocaleString()}원</td>
                  <td className="p-3.5 tabular-nums">{s.dueDate}</td>
                  <td className="p-3.5 text-brand-strong font-medium">{s.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
