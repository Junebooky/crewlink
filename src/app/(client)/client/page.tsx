'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AppShell } from '@/components/common/AppShell';
import {
  Users,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  Building,
  PlusCircle,
  ShieldCheck,
  Search,
  Filter,
  User,
  Sparkles,
  ArrowRight,
  Phone,
  Ruler,
  Award,
  Languages,
  Check,
  X,
  Loader2,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

export default function ClientDashboardPage() {
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<ClientProject | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [applicants, setApplicants] = useState<ApplicantItem[]>([]);
  const [isApplicantsLoading, setIsApplicantsLoading] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
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

      setActionMessage('크루가 성공적으로 선발(합격)되었습니다!');
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: unknown) {
      alert((err as Error).message || '승인 처리 중 오류가 발생했습니다.');
    } finally {
      setApprovingId(null);
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
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand hover:bg-brand-hover active:scale-[0.99] text-inverse text-sm font-bold rounded-xl shadow-xs transition-all shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>새 행사 요청</span>
          </Link>
        </div>

        {/* Live Metrics Grid */}
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

          <div className="p-4 bg-surface border border-brand-border/60 bg-brand-subtle/30 rounded-2xl shadow-xs">
            <div className="text-xs text-brand-strong font-bold flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              지원한 크루
            </div>
            <div className="text-2xl font-black text-brand-strong mt-1 tabular-nums">
              {totalApplicantsCount}명
            </div>
            <div className="text-[11px] text-brand-strong mt-1">심사 대기 및 승인</div>
          </div>

          <div className="p-4 bg-surface border border-emerald-200 bg-emerald-50/40 rounded-2xl shadow-xs">
            <div className="text-xs text-emerald-700 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              선발 완료
            </div>
            <div className="text-2xl font-black text-emerald-700 mt-1 tabular-nums">
              {totalApprovedCrew}명
            </div>
            <div className="text-[11px] text-emerald-600 mt-1">배정 확정 인원</div>
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
                      {/* Card Header */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isFullyApproved ? (
                            <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                              선발 완료
                            </span>
                          ) : hasApplicants ? (
                            <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-brand-soft text-brand-strong border border-brand/20">
                              심사 대기중 ({proj.applicantCount}명)
                            </span>
                          ) : (
                            <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                              지원자 모집 중
                            </span>
                          )}
                          <span className="text-[11px] text-muted font-medium">
                            {proj.startDate}
                          </span>
                        </div>
                        <span className="text-[11px] text-muted font-medium">
                          {new Date(proj.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Title & Venue */}
                      <h3 className="font-extrabold text-ink text-base group-hover:text-brand transition-colors line-clamp-1">
                        {proj.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-muted mt-1.5">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-muted/80" />
                        <span className="truncate">{proj.venueName || proj.roadAddress}</span>
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
                          <span className="font-extrabold text-ink">
                            지원 {proj.applicantCount}명
                          </span>
                          <span className="text-muted"> / 목표 {proj.requiredCount}명</span>
                          <span className="text-emerald-600 font-bold ml-1">
                            (선발 {proj.approvedCount}명)
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
        <div className="p-4 bg-canvas border border-border rounded-2xl flex items-start gap-3 text-xs text-muted">
          <ShieldCheck className="w-5 h-5 text-brand shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-ink">크루링크 안심 선발 프로세스:</strong> 주최사가 승인(합격)한 크루에게만 확정 알림이 발송되며, 실시간 출결 트래킹 및 전자 도급 계약서가 자동으로 체결됩니다.
          </div>
        </div>
      </div>

      {/* 지원자 심사 및 선발 모달 */}
      {isModalOpen && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl border border-border flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-border flex items-center justify-between shrink-0 bg-surface/95 backdrop-blur-sm">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-brand-soft text-brand-strong border border-brand/20">
                    지원자 심사
                  </span>
                  <span className="text-xs text-muted">
                    목표 {selectedProject.requiredCount}명 중 {selectedProject.approvedCount}명 선발 완료
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold text-ink line-clamp-1">
                  {selectedProject.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-muted hover:bg-canvas text-muted hover:text-ink flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Action Alert Banner */}
            {actionMessage && (
              <div className="bg-emerald-500 text-white px-5 py-2.5 text-xs font-bold flex items-center justify-between shrink-0 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>{actionMessage}</span>
                </div>
              </div>
            )}

            {/* Modal Body: Applicants List */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
              {isApplicantsLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-muted gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-brand" />
                  <span className="text-xs font-medium">지원자 프로필을 불러오고 있어요...</span>
                </div>
              ) : applicants.length === 0 ? (
                <div className="py-12 text-center text-muted space-y-2">
                  <User className="w-10 h-10 mx-auto text-muted/60" />
                  <div className="font-bold text-ink text-sm">아직 지원한 크루가 없습니다</div>
                  <p className="text-xs">
                    홈 피드에 공고가 게시되었으며, 크루들의 지원이 접수되면 이곳에 프로필이 노출됩니다.
                  </p>
                </div>
              ) : (
                applicants.map((app) => {
                  const isApproved = app.status === 'approved' || app.status === 'accepted';
                  const isProcessing = approvingId === app.id;
                  const crew = app.crew;

                  return (
                    <div
                      key={app.id}
                      className={cn(
                        'p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4',
                        isApproved
                          ? 'bg-emerald-50/30 border-emerald-200'
                          : 'bg-surface border-border hover:border-brand/40 shadow-xs'
                      )}
                    >
                      {/* Left: Crew Profile Specs */}
                      <div className="flex items-start gap-3.5 min-w-0 flex-1">
                        {/* Upper Body Visual Profile Avatar */}
                        <div className="w-14 h-14 rounded-2xl bg-brand-soft border border-brand/20 overflow-hidden relative shrink-0 flex items-center justify-center shadow-xs">
                          {crew.profileImageUrl ? (
                            <Image
                              src={crew.profileImageUrl}
                              alt={crew.fullName}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="font-black text-brand-strong text-lg">
                              {crew.fullName.slice(0, 1)}
                            </div>
                          )}
                        </div>

                        {/* Crew Details Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-extrabold text-ink text-base">
                              {crew.fullName}
                            </h4>
                            <span className="text-xs text-muted flex items-center gap-1">
                              <Phone className="w-3 h-3 text-muted" />
                              {crew.phone}
                            </span>
                            {isApproved ? (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                선발 완료
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                                심사 대기
                              </span>
                            )}
                          </div>

                          {/* Physical Specs & Experience Chips */}
                          <div className="mt-2 flex items-center gap-1.5 flex-wrap text-[11px] text-muted">
                            <span className="px-2 py-0.5 rounded-md bg-surface-muted font-medium text-ink">
                              키 {crew.heightCm ? `${crew.heightCm}cm` : '176cm'}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-surface-muted font-medium text-ink">
                              상/하의 {crew.topSize || 'L'} / {crew.bottomSize || '32'}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-surface-muted font-medium text-ink">
                              신발 {crew.shoeSizeMm ? `${crew.shoeSizeMm}mm` : '270mm'}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-brand-soft text-brand-strong font-bold">
                              경력 {crew.experienceYears}년 ({crew.totalShiftsCompleted}회)
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-bold">
                              ★ {crew.ratingAvg}
                            </span>
                          </div>

                          {/* Bio */}
                          <p className="text-xs text-muted mt-2 line-clamp-1">
                            "{crew.bio}"
                          </p>

                          {/* Languages */}
                          {crew.hasLanguages && (
                            <div className="mt-1.5 flex items-center gap-1 text-[11px] text-brand-strong font-medium">
                              <Languages className="w-3.5 h-3.5" />
                              <span>외국어 가능: {crew.languages.join(', ')}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Approval Action */}
                      <div className="w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border-subtle flex justify-end">
                        {isApproved ? (
                          <div className="px-4 py-2 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>선발 확정</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleApproveApplicant(app.id)}
                            disabled={isProcessing}
                            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-inverse text-xs sm:text-sm font-bold shadow-xs active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>선발 처리 중...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4 text-amber-300" />
                                <span>승인(합격)</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-border bg-canvas/60 flex items-center justify-between text-xs text-muted shrink-0">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-brand" />
                선발된 크루에게 즉시 근무 안내 메시지가 발송됩니다.
              </span>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-surface border border-border text-ink font-bold hover:bg-canvas cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
