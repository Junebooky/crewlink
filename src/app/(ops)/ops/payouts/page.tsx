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
      status: '지급 준비 완료 (검증됨)',
      dueDate: '2026-10-15',
    },
  ];

  return (
    <AppShell initialRole="ops">
      <div className="max-w-5xl mx-auto px-4 py-6 w-full space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">지급 관리 & 원천세 대사</h1>
          <p className="text-xs text-slate-500 mt-0.5">3.3% 원천징수 세액 검증 및 크루 정산 송금 큐</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
              <tr>
                <th className="p-3.5">수취인 (크루)</th>
                <th className="p-3.5">과업 행사</th>
                <th className="p-3.5">세전 보수</th>
                <th className="p-3.5">원천징수세(3.3%)</th>
                <th className="p-3.5">실지급액</th>
                <th className="p-3.5">지급 예정일</th>
                <th className="p-3.5">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {settlements.map((s) => (
                <tr key={s.id}>
                  <td className="p-3.5 font-bold text-slate-900">{s.crewName}</td>
                  <td className="p-3.5">{s.project}</td>
                  <td className="p-3.5 tabular-nums">{s.gross.toLocaleString()}원</td>
                  <td className="p-3.5 tabular-nums text-red-600">-{s.tax.toLocaleString()}원</td>
                  <td className="p-3.5 tabular-nums font-bold text-[#1E60F3]">{s.net.toLocaleString()}원</td>
                  <td className="p-3.5 tabular-nums">{s.dueDate}</td>
                  <td className="p-3.5 text-emerald-600 font-medium">{s.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
