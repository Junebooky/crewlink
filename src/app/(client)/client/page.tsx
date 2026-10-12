'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AppShell } from '@/components/common/AppShell';
import {
  Users,
  CheckCircle2,
  Calendar,
  PlusCircle,
  ShieldCheck,
  User,
  X,
  Loader2,
  ChevronRight,
  MapPin,
  Check,
} from 'lucide-react';
import { ApplicantReviewCard } from '@/components/client/ApplicantReviewCard';

interface ClientProject {
  id: string;
  title: string;
  venueName: string;
  roadAddress: string;
  detailAddress?: string;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
  requiredCount: number;
  applicantCount: number;
  approvedCount: number;
  sowSpec?: Record<string, any>;
  shifts?: any[];
}

interface ApplicantItem {
  id: string;
  projectId: string;
  shiftId: string;
  status: string; // 'applied', 'approved', etc.
  appliedAt: string;
  crew: {
    personId: string;
    fullName: string;
    phone: string;
    profileImageUrl: string | null;
    heightCm: number | null;
    topSize: string | null;
    bottomSize: string | null;
    shoeSizeMm: number | null;
    experienceYears: number;
    bio: string;
    languages: string[];
    hasLanguages: boolean;
    ratingAvg: number;
    totalShiftsCompleted: number;
  };
}

function formatRegistrationDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}.${m}.${day}`;
  } catch {
    return dateStr;
  }
}

function formatEventSchedule(proj: ClientProject): string {
  const start = (proj.startDate || '').replace(/-/g, '.');
  const end = (proj.endDate || '').replace(/-/g, '.');
  const sow = proj.sowSpec || {};
  const totalDays = sow.totalDays || (start && end && start !== end ? 2 : 1);

  let datePart = '';
  if (start && end && start !== end) {
    datePart = `${start} ~ ${end} (${totalDays}일간)`;
  } else if (start) {
    datePart = `${start} (1일간)`;
  } else {
    datePart = '일정 미정';
  }

  // Time part
  let timePart = '';
  const firstShift = proj.shifts?.[0];
  if (firstShift?.start_time && firstShift?.end_time) {
    try {
      const s = new Date(firstShift.start_time);
      const e = new Date(firstShift.end_time);
      const sH = String(s.getUTCHours()).padStart(2, '0');
      const sM = String(s.getUTCMinutes()).padStart(2, '0');
      const eH = String(e.getUTCHours()).padStart(2, '0');
      const eM = String(e.getUTCMinutes()).padStart(2, '0');
      timePart = ` · ${sH}:${sM} ~ ${eH}:${eM}`;
    } catch {
      // fallback
    }
  } else if (sow.startTime && sow.endTime) {
    timePart = ` · ${sow.startTime} ~ ${sow.endTime}`;
  }

  return `${datePart}${timePart}`;
}

export default function ClientDashboardPage() {
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<ClientProject | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [applicants, setApplicants] = useState<ApplicantItem[]>([]);
  const [isApplicantsLoading, setIsApplicantsLoading] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Load client projects from API
  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/client/projects');
      if (res.ok) {
        const data = await res.json();
        if (data.projects) {
          setProjects(data.projects);
        }
      }
    } catch (err) {
      console.error('Failed to load client projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Open applicant review modal for a project
  const handleOpenReviewModal = async (project: ClientProject) => {
    setSelectedProject(project);
    setIsModalOpen(true);
    setIsApplicantsLoading(true);
    setActionMessage(null);

    try {
      const res = await fetch(`/api/client/projects/${project.id}/applications`);
      if (res.ok) {
        const data = await res.json();
        setApplicants(data.applications || []);
      }
    } catch (err) {
      console.error('Failed to load applicants:', err);
    } finally {
      setIsApplicantsLoading(false);
    }
  };

  // Approve an applicant
  const handleApproveApplicant = async (applicationId: string) => {
    setApprovingId(applicationId);
    setActionMessage(null);

    try {
      const res = await fetch(`/api/client/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || '승인 처리에 실패했습니다.');
      }

      // Update local state immediately
      setApplicants((prev) =>
        prev.map((app) =>
          app.id === applicationId ? { ...app, status: 'approved' } : app
        )
      );

      // Update project counters
      setProjects((prev) =>
        prev.map((proj) =>
          proj.id === selectedProject?.id
            ? { ...proj, approvedCount: proj.approvedCount + 1 }
            : proj
        )
      );

      if (selectedProject) {
        setSelectedProject((prev) =>
          prev ? { ...prev, approvedCount: prev.approvedCount + 1 } : null
        );
      }

      setActionMessage('크루가 성공적으로 선발되었습니다.');
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: unknown) {
      alert((err as Error).message || '승인 처리 중 오류가 발생했습니다.');
    } finally {
      setApprovingId(null);
    }
  };

  // Cancel approval of an applicant
  const handleCancelApplicant = async (applicationId: string) => {
    setCancellingId(applicationId);
    setActionMessage(null);

    try {
      const res = await fetch(`/api/client/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'applied' }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || '배정 취소 처리에 실패했습니다.');
      }

      // Update local state immediately
      setApplicants((prev) =>
        prev.map((app) =>
          app.id === applicationId ? { ...app, status: 'applied' } : app
        )
      );

      // Update project counters
      setProjects((prev) =>
        prev.map((proj) =>
          proj.id === selectedProject?.id
            ? { ...proj, approvedCount: Math.max(0, proj.approvedCount - 1) }
            : proj
        )
      );

      if (selectedProject) {
        setSelectedProject((prev) =>
          prev ? { ...prev, approvedCount: Math.max(0, prev.approvedCount - 1) } : null
        );
      }

      setActionMessage('배정이 취소되었습니다.');
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: unknown) {
      alert((err as Error).message || '배정 취소 처리 중 오류가 발생했습니다.');
    } finally {
      setCancellingId(null);
    }
  };

  // Metrics summary
  const totalProjectsCount = projects.length;
  const totalRequiredCrew = projects.reduce((acc, p) => acc + p.requiredCount, 0);
  const totalApplicantsCount = projects.reduce((acc, p) => acc + p.applicantCount, 0);
  const totalApprovedCrew = projects.reduce((acc, p) => acc + p.approvedCount, 0);

  return (
    <AppShell initialRole="client">
      <div className="max-w-5xl mx-auto px-4 py-6 w-full space-y-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-brand bg-brand-soft px-2.5 py-0.5 rounded-full border border-brand/20">
                주최사 대시보드
              </span>
              <span className="text-xs text-muted font-medium">
                (주)네온패밀리
              </span>
            </div>
            <h1 className="text-2xl font-black text-ink mt-1 tracking-tight">
              행사 발주 및 크루 지원자 관리
            </h1>
            <p className="text-xs sm:text-sm text-muted mt-0.5">
              발주한 행사를 확인하고, 지원한 크루들의 비주얼 프로필을 심사하여 승인하세요.
            </p>
          </div>

          <Link
            href="/client/request"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand hover:bg-brand-hover active:scale-[0.99] text-inverse text-sm font-bold rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>새 행사 요청</span>
          </Link>
        </div>

        {/* Live Metrics Grid (Brand Palette Unified) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 bg-surface border border-border rounded-2xl shadow-xs">
            <div className="text-xs text-muted font-semibold">발주한 행사</div>
            <div className="text-2xl font-black text-ink mt-1 tabular-nums">
              {totalProjectsCount}건
            </div>
            <div className="text-[11px] text-muted mt-1">등록된 전체 프로젝트</div>
          </div>

          <div className="p-4 bg-surface border border-border rounded-2xl shadow-xs">
            <div className="text-xs text-muted font-semibold">필요 인원</div>
            <div className="text-2xl font-black text-ink mt-1 tabular-nums">
              {totalRequiredCrew}명
            </div>
            <div className="text-[11px] text-muted mt-1">현장 총 모집 목표</div>
          </div>

          <div className="p-4 bg-surface border border-border rounded-2xl shadow-xs">
            <div className="text-xs text-brand-strong font-bold flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-brand" />
              지원한 크루
            </div>
            <div className="text-2xl font-black text-brand mt-1 tabular-nums">
              {totalApplicantsCount}명
            </div>
            <div className="text-[11px] text-muted mt-1">심사 대기 및 승인</div>
          </div>

          <div className="p-4 bg-surface border border-border rounded-2xl shadow-xs">
            <div className="text-xs text-black font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-brand" />
              선발 완료
            </div>
            <div className="text-2xl font-black text-brand-strong mt-1 tabular-nums">
              {totalApprovedCrew}명
            </div>
            <div className="text-[11px] text-muted mt-1">배정 확정 인원</div>
          </div>
        </div>

        {/* Projects List Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink">
              발주 행사 목록 ({projects.length})
            </h2>
            <span className="text-xs text-muted">
              카드를 클릭하여 지원자 프로필을 심사하세요
            </span>
          </div>

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-muted gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-brand" />
              <span className="text-xs font-medium">행사 목록을 불러오는 중...</span>
            </div>
          ) : projects.length === 0 ? (
            <div className="p-12 bg-surface border border-border rounded-3xl text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-surface-muted flex items-center justify-center mx-auto text-muted">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-ink text-base">발주한 행사가 없습니다</h3>
                <p className="text-xs text-muted mt-1">
                  새 행사를 요청하면 즉시 크루 홈 화면에 노출되고 지원자를 모집할 수 있어요.
                </p>
              </div>
              <Link
                href="/client/request"
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-inverse text-xs font-bold rounded-xl"
              >
                <PlusCircle className="w-4 h-4" />
                <span>행사 요청하기</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((proj) => {
                const isFullyApproved =
                  proj.approvedCount >= proj.requiredCount && proj.requiredCount > 0;
                const hasApplicants = proj.applicantCount > 0;

                return (
                  <div
                    key={proj.id}
                    onClick={() => handleOpenReviewModal(proj)}
                    className="group bg-surface border border-border hover:border-brand/40 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      {/* Card Header: Standardized Status Badge & Clear Registration Date */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        {isFullyApproved ? (
                          <span className="bg-brand-soft/40 text-black font-bold text-xs px-2.5 py-1 rounded-lg border border-brand/20">
                            선발 완료
                          </span>
                        ) : hasApplicants ? (
                          <span className="bg-brand-soft/30 text-brand-strong font-bold text-xs px-2.5 py-1 rounded-lg border border-brand/20">
                            심사 대기중 ({proj.applicantCount}명)
                          </span>
                        ) : (
                          <span className="bg-surface-muted text-muted font-bold text-xs px-2.5 py-1 rounded-lg border border-border">
                            모집 중
                          </span>
                        )}

                        <span className="text-xs text-muted font-medium">
                          등록일 {formatRegistrationDate(proj.createdAt)}
                        </span>
                      </div>

                      {/* Project Title & Venue */}
                      <h3 className="font-extrabold text-ink text-base group-hover:text-brand transition-colors line-clamp-1">
                        {proj.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-muted mt-1.5">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-muted/70" />
                        <span className="truncate">{proj.venueName || proj.roadAddress}</span>
                      </div>

                      {/* Prominent Event Schedule Box */}
                      <div className="mt-3.5 p-3 rounded-2xl bg-white border border-border-subtle flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-surface border border-border flex items-center justify-center shrink-0 text-brand">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] font-semibold text-muted">행사 일정</div>
                          <div className="text-xs sm:text-sm font-bold text-ink truncate">
                            {formatEventSchedule(proj)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer: Applicant Status Pill & CTA */}
                    <div className="mt-5 pt-3.5 border-t border-border-subtle flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-1.5 overflow-hidden">
                          <div className="inline-block h-6 w-6 rounded-full ring-2 ring-surface bg-brand-soft text-brand-strong font-black text-[10px] flex items-center justify-center">
                            크
                          </div>
                          <div className="inline-block h-6 w-6 rounded-full ring-2 ring-surface bg-brand-subtle text-brand font-black text-[10px] flex items-center justify-center">
                            루
                          </div>
                        </div>
                        <div className="text-xs">
                          <span className="font-medium text-muted">지원 </span>
                          <span className="text-brand font-extrabold">{proj.applicantCount}명</span>
                          <span className="text-muted"> / 목표 {proj.requiredCount}명</span>
                          <span className="text-muted font-medium ml-1.5">
                            · 선발 <span className="text-brand-strong font-bold">{proj.approvedCount}명</span>
                          </span>
                        </div>
                      </div>

                      <div className="inline-flex items-center gap-1 text-xs font-bold text-brand group-hover:translate-x-0.5 transition-transform">
                        <span>심사하기</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Support Banner */}
        <div className="p-4 bg-white border border-border rounded-2xl flex items-start gap-3 text-xs text-muted">
          <ShieldCheck className="w-5 h-5 text-brand shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-ink">크루링크 안심 선발 프로세스:</strong> 주최사가 승인(합격)한 크루에게만 확정 알림이 발송되며, 실시간 출결 트래킹 및 전자 도급 계약서가 자동으로 체결됩니다.
          </div>
        </div>
      </div>

      {/* 지원자 심사 및 선발 모달 */}
      {isModalOpen && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl border border-border flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-border flex items-center justify-between shrink-0 bg-white">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-brand-soft text-brand-strong border border-brand/20">
                    지원자 심사
                  </span>
                  <span className="text-xs text-muted">
                    목표 {selectedProject.requiredCount}명 중{' '}
                    <strong className="text-black font-bold">
                      {selectedProject.approvedCount}명
                    </strong>{' '}
                    선발 완료
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold text-ink line-clamp-1">
                  {selectedProject.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-muted hover:bg-surface text-muted hover:text-ink border border-border/50 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                aria-label="모달 닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Action Alert Banner (Brand Themed) */}
            {actionMessage && (
              <div className="bg-brand text-white px-5 py-2.5 text-xs font-bold flex items-center justify-between shrink-0 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>{actionMessage}</span>
                </div>
              </div>
            )}

            {/* Modal Body: Applicants List */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 bg-surface-muted/30">
              {isApplicantsLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-muted gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-brand" />
                  <span className="text-xs font-medium">지원자 프로필을 불러오고 있어요...</span>
                </div>
              ) : applicants.length === 0 ? (
                <div className="py-12 text-center text-muted space-y-2">
                  <User className="w-10 h-10 mx-auto text-muted/50" />
                  <div className="font-bold text-ink text-sm">아직 지원한 크루가 없습니다</div>
                  <p className="text-xs">
                    홈 피드에 공고가 게시되었으며, 크루들의 지원이 접수되면 이곳에 프로필이 노출됩니다.
                  </p>
                </div>
              ) : (
                applicants.map((app) => (
                  <ApplicantReviewCard
                    key={app.id}
                    application={app}
                    isProcessing={approvingId === app.id || cancellingId === app.id}
                    onApprove={handleApproveApplicant}
                    onCancel={handleCancelApplicant}
                  />
                ))
              )}
            </div>

            {/* Modal Footer (Toss-style conversational guidance) */}
            <div className="px-6 py-4 border-t border-border bg-white flex items-center justify-center shrink-0">
              <div className="flex items-center gap-2 text-xs font-medium text-muted text-center tracking-tight">
                <ShieldCheck className="w-4 h-4 text-brand shrink-0" />
                <span>크루에게 행사 확정 알림과 현장 안내를 보냈어요</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
