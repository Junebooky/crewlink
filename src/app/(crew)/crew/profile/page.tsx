'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Image from 'next/image';
import {
  User,
  Camera,
  Lock,
  AlertCircle,
  Loader2,
  ChevronDown,
  Check,
  Trash2,
  Sparkles,
  Lightbulb,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AvatarCropModal } from '@/components/profile/AvatarCropModal';
import { LoginModal } from '@/components/auth/LoginModal';

// 유니폼 규격 상수
const TOP_SIZES = ['S', 'M', 'L', 'XL', '2XL'];
const BOTTOM_SIZES = ['26', '28', '30', '32', '34', '36', '38'];
const BOTTOM_SIZE_OPTIONS = BOTTOM_SIZES.map((size) => ({
  value: size,
  label: `${size}인치`,
}));

const SHOE_SIZES = [230, 235, 240, 245, 250, 255, 260, 265, 270, 275, 280, 285, 290];
const SHOE_SIZE_OPTIONS = SHOE_SIZES.map((sz) => ({
  value: sz,
  label: `${sz} mm`,
}));

const EXPERIENCE_OPTIONS = [
  { value: 0, label: '신입 (행사 경험 없음)' },
  { value: 0.5, label: '6개월 미만' },
  { value: 1, label: '1년차' },
  { value: 2, label: '2년차' },
  { value: 3, label: '3년 이상 프로페셔널' },
];

/**
 * 브라우저 HTML5 Canvas 기반 가로 최대 1,200px 비율 리사이징 & JPEG (quality: 0.82) 압축 함수
 * HEIC/고해상도 사진을 웹 표준 JPEG로 사전 정규화하여 300KB~600KB 수준으로 최적화 업로드
 */
async function optimizeImageFile(file: File): Promise<File> {
  return new Promise((resolve) => {
    if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
      resolve(file);
      return;
    }

    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const maxWidth = 1200;
      let { width, height } = img;

      // 가로 최대 1,200px 기준 비율 리사이징
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const baseName = file.name.replace(/\.[^/.]+$/, '');
          const optimizedFile = new File([blob], `${baseName}.jpg`, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(optimizedFile);
        },
        'image/jpeg',
        0.82
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      // 브라우저 렌더링 불가 시 원본 파일 fallback
      resolve(file);
    };

    img.src = objectUrl;
  });
}

// 외국어 응대 옵션 (한국어 제외, 기본 선택 강제 해제)
const AVAILABLE_LANGUAGES = ['영어', '일본어', '중국어', '기타 외국어'];

/**
 * 크루링크 전용 커스텀 플로팅 드롭다운 (네이티브 <select> 대체)
 */
interface CustomSelectOption<T extends string | number> {
  value: T;
  label: string;
}

interface CustomSelectProps<T extends string | number> {
  id?: string;
  value: T;
  options: CustomSelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  className?: string;
}

function CustomSelect<T extends string | number>({
  id,
  value,
  options,
  onChange,
  placeholder = '선택해 주세요',
  className = '',
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full h-12 px-4 rounded-xl border border-border/80 bg-white text-sm font-semibold text-ink flex items-center justify-between shadow-2xs hover:border-brand-border cursor-pointer transition-colors focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
      >
        <span className={cn('truncate', !selectedOption && 'text-muted font-normal')}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-muted transition-transform duration-200 shrink-0 ml-2',
            isOpen && 'rotate-180 text-brand'
          )}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1.5 z-30 max-h-56 overflow-y-auto p-1.5 rounded-2xl border border-border bg-white shadow-lg animate-in fade-in zoom-in-95 duration-150 scrollbar-none"
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={String(opt.value)}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full px-3.5 py-2.5 rounded-xl text-sm font-medium text-ink hover:bg-brand-soft hover:text-brand-strong cursor-pointer flex items-center justify-between transition-colors',
                  isSelected && 'bg-brand-soft text-brand-strong font-semibold'
                )}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check className="w-4 h-4 text-brand shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// 개발/테스트 환경 기본 크루 식별자 (로컬 개발 401 방지)
const DEV_ACTOR_PERSON_ID = '11111111-1111-1111-1111-111111111111';

function getDevAuthHeaders(): Record<string, string> {
  if (process.env.NODE_ENV !== 'production') {
    return { 'x-actor-person-id': DEV_ACTOR_PERSON_ID };
  }
  return {};
}

export default function CrewProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);
  const savedTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 인증 상태 및 로그인 모달 제어
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isUnauthenticated, setIsUnauthenticated] = useState(false);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // 사진 원형 크롭 모달 상태
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropSourceUrl, setCropSourceUrl] = useState<string | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [heightCm, setHeightCm] = useState<number | string>('');
  const [topSize, setTopSize] = useState('L');
  const [bottomSize, setBottomSize] = useState('30');
  const [shoeSizeMm, setShoeSizeMm] = useState<number | string>(265);
  const [experienceYears, setExperienceYears] = useState<number | string>(1);
  const [bio, setBio] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);

  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  // Load profile from API
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/crew/profile', {
        cache: 'no-store',
        headers: getDevAuthHeaders(),
      });

      if (res.status === 401) {
        setIsUnauthenticated(true);
        return;
      }

      if (res.ok) {
        setIsUnauthenticated(false);
        const data = await res.json();
        if (data.success && data.profile) {
          setFullName(data.fullName || '');
          setPhoneNumber(data.phoneNumber || '');
          setEmail(data.email || '');
          setProfileImageUrl(data.profile.profileImageUrl || null);
          setHeightCm(data.profile.heightCm || '');
          setTopSize(data.profile.topSize || 'L');
          setBottomSize(data.profile.bottomSize || '30');
          setShoeSizeMm(data.profile.shoeSizeMm || 265);
          setExperienceYears(data.profile.experienceYears ?? 1);
          setBio(data.profile.bio || '');
          // 한국어 제외하여 초기화
          const existingLanguages = (data.profile.languages || []).filter(
            (l: string) => l !== '한국어'
          );
          setLanguages(existingLanguages);
        }
      }
    } catch (err) {
      console.error('[Failed to fetch crew profile]:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Handle phone formatting (010-XXXX-XXXX)
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
    if (raw.length <= 3) {
      setPhoneNumber(raw);
    } else if (raw.length <= 7) {
      setPhoneNumber(`${raw.slice(0, 3)}-${raw.slice(3)}`);
    } else {
      setPhoneNumber(`${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7)}`);
    }
  };

  // 사진 선택 시 SVG 검증 후 원형 편집(크롭) 모달 실행
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    // SVG 파일 등 스크립트 실행 벡터 파일 사전 차단
    if (rawFile.type === 'image/svg+xml' || rawFile.name.toLowerCase().endsWith('.svg')) {
      setFeedback({
        type: 'error',
        message: 'SVG 이미지는 보안상 업로드할 수 없습니다. JPG 또는 PNG 사진을 선택해 주세요.',
      });
      if (avatarInputRef.current) avatarInputRef.current.value = '';
      return;
    }

    setFeedback(null);
    const localUrl = URL.createObjectURL(rawFile);
    setCropSourceUrl(localUrl);
    setIsCropModalOpen(true);
    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
    }
  };

  // 원형 편집 모달에서 크롭 완료 시 Supabase Storage 업로드 실행
  const handleCropComplete = async (croppedBlob: Blob) => {
    setUploadingAvatar(true);
    setFeedback(null);

    // 1. 브라우저 로컬 미리보기 즉시 반영
    const localPreview = URL.createObjectURL(croppedBlob);
    setPreviewUrl(localPreview);

    try {
      // 2. Blob을 File 객체로 변환하여 Storage 업로드
      const croppedFile = new File([croppedBlob], 'avatar.jpg', {
        type: 'image/jpeg',
        lastModified: Date.now(),
      });

      const formData = new FormData();
      formData.append('file', croppedFile);
      formData.append('type', 'avatar');

      const res = await fetch('/api/crew/profile/upload', {
        method: 'POST',
        headers: getDevAuthHeaders(),
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          setIsUnauthenticated(true);
          setIsLoginModalOpen(true);
          throw new Error('로그인이 필요합니다. 로그인 후 다시 사진을 등록해 주세요.');
        }
        throw new Error(data.message || '사진 업로드에 실패했습니다.');
      }

      setProfileImageUrl(data.url);
      setIsCropModalOpen(false);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('crewlink:auth-changed'));
      }
      // [요구사항 1]: 프로필 사진 등록 시 성공 피드백 팝업창을 띄우지 않음!
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: (err as Error).message || '사진 업로드 중 오류가 발생했습니다.',
      });
      setPreviewUrl(null);
    } finally {
      setUploadingAvatar(false);
    }
  };

  // 현재 등록된 사진의 원형 위치/확대 다시 맞추기
  const handleOpenCropForCurrent = () => {
    const currentPhoto = previewUrl || profileImageUrl;
    if (currentPhoto) {
      setCropSourceUrl(currentPhoto);
      setIsCropModalOpen(true);
    }
  };

  // 사진 제거
  const handleRemovePhoto = () => {
    setProfileImageUrl(null);
    setPreviewUrl(null);
    setCropSourceUrl(null);
    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('crewlink:auth-changed'));
    }
  };

  // Language toggle (0개 선택도 허용)
  const toggleLanguage = (lang: string) => {
    setLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  // 경력 옵션 목록 구성 (기존 값이 리스트에 없을 경우 자동 포함)
  const experienceOptions = useMemo(() => {
    const numericExp = Number(experienceYears);
    const exists = EXPERIENCE_OPTIONS.some((o) => o.value === numericExp);
    if (!exists && experienceYears !== '') {
      return [
        ...EXPERIENCE_OPTIONS,
        { value: numericExp, label: `${numericExp}년차` },
      ].sort((a, b) => a.value - b.value);
    }
    return EXPERIENCE_OPTIONS;
  }, [experienceYears]);

  // Submit form handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/crew/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getDevAuthHeaders(),
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phoneNumber,
          profileImageUrl,
          heightCm: heightCm ? Number(heightCm) : null,
          topSize,
          bottomSize,
          shoeSizeMm: shoeSizeMm ? Number(shoeSizeMm) : null,
          experienceYears: experienceYears !== '' ? Number(experienceYears) : 0,
          bio,
          languages,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          setIsUnauthenticated(true);
          setIsLoginModalOpen(true);
          throw new Error('로그인이 필요합니다. 먼저 로그인해 주세요.');
        }
        throw new Error(data.message || '프로필 정보 저장에 실패했습니다.');
      }

      // [요구사항 2]: 저장 완료 시 버튼 상태를 '저장완료'로 전환
      setIsSavedSuccess(true);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => {
        setIsSavedSuccess(false);
      }, 2500);

      // 네브바 프로필 동기화
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('crewlink:auth-changed'));
      }
      // [요구사항 4]: "프로필 정보가 안전하게 저장되었습니다" 메세지 카드 섹션 아예 삭제 (setFeedback 호출 제거)
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: (err as Error).message || '저장 중 오류가 발생했습니다.',
      });
    } finally {
      setSaving(false);
    }
  };

  const isFormDisabled = saving || uploadingAvatar;
  const currentPhoto = previewUrl || profileImageUrl;

  return (
    <>
      <div className="w-full bg-canvas min-h-full">
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full space-y-7 pb-28">
          {/* 1. 토스풍(Toss-style) 대화형 메인 타이틀 */}
          <div className="space-y-1.5 pt-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
              어떤 크루인지 알려주세요
            </h1>
            <p className="text-sm text-muted break-keep">
              프로필이 탄탄할수록 주최사의 선택을 더 빠르게 받아요.
            </p>
          </div>

          {/* 비로그인 알림 배너 */}
          {isUnauthenticated && (
            <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200/80 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>로그인 후 프로필을 안전하게 관리하고 배정을 지원받으세요.</span>
              </div>
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 text-white font-semibold text-xs hover:bg-amber-700 transition-colors shrink-0 cursor-pointer shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>로그인하기</span>
              </button>
            </div>
          )}

          {/* [요구사항 4]: 성공 메시지 카드 섹션 완전 삭제 (오류 발생 시에만 최소 에러 배너 표시) */}
          {feedback && feedback.type === 'error' && (
            <div className="p-4 rounded-2xl border border-red-200 bg-red-50 text-xs text-red-700 flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{feedback.message}</span>
            </div>
          )}

          {loading ? (
            <div className="py-20 text-center space-y-3">
              <Loader2 className="w-7 h-7 text-brand animate-spin mx-auto" />
              <p className="text-xs text-muted">프로필 정보를 불러오는 중입니다…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
              {/* 2. 프로필 사진 영역 (은은한 곡선 파동 배경 & 네온 블루 글로우) */}
              <section className="bg-white rounded-3xl p-5 sm:p-6 shadow-[0_12px_40px_rgba(15,23,42,0.08)] relative overflow-hidden mb-5">
                {/* 카드 내부의 은은한 파란색 곡선 백그라운드 (데코레이션) */}
                <div className="absolute inset-0 pointer-events-none z-0 opacity-40">
                  <div className="absolute -top-10 -right-20 w-[300px] h-[300px] bg-gradient-to-br from-brand-soft/60 to-transparent rounded-full filter blur-3xl" />
                  <div className="absolute top-20 -left-20 w-[250px] h-[250px] bg-gradient-to-tr from-blue-100/40 via-brand-soft/20 to-transparent rounded-full filter blur-2xl" />
                  {/* 물결 모양의 SVG 데코 */}
                  <svg className="absolute bottom-0 left-0 w-full h-1/2 text-brand-soft/30 opacity-70" viewBox="0 0 1440 320" fill="none">
                    <path fill="currentColor" d="M0,160L80,181.3C160,203,320,245,480,245C640,245,800,203,960,181.3C1120,160,1280,160,1360,160L1440,160L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
                  </svg>
                </div>

                {/* 타이틀 & 소개 영역 */}
                <div className="flex items-center gap-2 mb-4 text-left relative z-10">
                  <Image
                    src="/assets/clay/profile.png"
                    alt="프로필 사진"
                    width={32}
                    height={32}
                    className="w-8 h-8 sm:w-8 sm:h-8 object-contain shrink-0"
                  />
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-ink tracking-tight">프로필 사진</h2>
                    <p className="text-xs sm:text-sm text-muted font-medium mt-0.5 break-keep">
                      얼굴이 잘 보이는 밝은 인상의 사진을 올려주세요.
                    </p>
                  </div>
                </div>

                {/* [핵심] 인물 사진 파란색 네온 글로우(Blue Neon Glow) */}
                <div className="w-40 h-40 sm:w-44 sm:h-44 rounded-full relative mx-auto my-6 flex items-center justify-center shrink-0 z-10">
                  <div
                    onClick={() => {
                      if (uploadingAvatar) return;
                      if (currentPhoto) {
                        handleOpenCropForCurrent();
                      } else {
                        avatarInputRef.current?.click();
                      }
                    }}
                    className="w-full h-full rounded-full overflow-hidden border-4 border-[#00BFFF] shadow-[0_0_24px_rgba(0,191,255,0.5),_0_0_12px_rgba(0,191,255,0.3)] bg-slate-50 relative flex items-center justify-center cursor-pointer transition-transform hover:scale-[1.01]"
                    title={currentPhoto ? '사진 위치 조절하기' : '사진 등록하기'}
                  >
                    {currentPhoto ? (
                      <Image
                        src={currentPhoto}
                        alt="프로필 사진"
                        fill
                        className="rounded-full object-cover w-full h-full"
                        unoptimized
                      />
                    ) : (
                      <User className="w-16 h-16 sm:w-20 sm:h-20 text-muted/40 stroke-[1.5]" />
                    )}

                    {/* 업로드 중 로딩 오버레이 */}
                    {uploadingAvatar && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-2xs flex items-center justify-center text-white z-10 rounded-full">
                        <Loader2 className="w-7 h-7 animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* 카메라 오버레이 버튼 (오른쪽 아래) */}
                  <button
                    type="button"
                    disabled={uploadingAvatar}
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute bottom-1 right-1 w-11 h-11 rounded-full bg-brand hover:bg-brand-hover border-2 sm:border-[2.5px] border-white flex items-center justify-center text-white shadow-[0_4px_14px_rgba(0,191,255,0.55)] transition-all transform hover:scale-105 active:scale-95 cursor-pointer z-20"
                    aria-label="사진 등록/변경"
                    title="변경"
                  >
                    <Camera className="w-5 h-5 stroke-[2.2]" />
                  </button>
                </div>

                {/* 숨김 파일 인풋 */}
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/heic, image/heif"
                  className="hidden"
                  onChange={handlePhotoSelect}
                />

                {/* 하단 액션 버튼 그룹 */}
                <div className="flex gap-3 mt-4 z-10 relative">
                  <button
                    type="button"
                    disabled={uploadingAvatar}
                    onClick={() => avatarInputRef.current?.click()}
                    className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-95 text-white font-bold text-sm shadow-[0_4px_15px_rgba(37,99,235,0.3)] flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
                  >
                    <Camera className="w-4 h-4 stroke-[2.2]" />
                    <span>{currentPhoto ? '변경' : '사진 등록하기'}</span>
                  </button>

                  {currentPhoto && (
                    <button
                      type="button"
                      disabled={uploadingAvatar}
                      onClick={handleRemovePhoto}
                      className="px-5 h-12 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/80 text-muted hover:text-danger font-bold text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-4 h-4 stroke-[2]" />
                      <span>삭제</span>
                    </button>
                  )}
                </div>

                {/* 추천 안내 팁 배너 */}
                <div className="w-full mt-3.5 p-3.5 rounded-2xl bg-brand-soft/20 text-brand-strong text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 z-10 relative">
                  <Lightbulb className="w-4 h-4 text-brand shrink-0" />
                  <span>선명한 셀카 또는 증명사진을 추천해요</span>
                </div>

                {/* 원형 크롭 및 위치 조절 모달 */}
                <AvatarCropModal
                  isOpen={isCropModalOpen}
                  imageSrc={cropSourceUrl}
                  onClose={() => setIsCropModalOpen(false)}
                  onCropComplete={handleCropComplete}
                  isUploading={uploadingAvatar}
                />
              </section>

              {/* 3. 기본 정보 (이름, 연락처) */}
              <section className="bg-white rounded-3xl p-5 sm:p-6 shadow-[0_0_0_1px_rgba(15,23,42,0.04),0_2px_8px_rgba(15,23,42,0.06),0_12px_28px_-4px_rgba(15,23,42,0.12),0_24px_48px_-8px_rgba(15,23,42,0.12)] hover:shadow-[0_0_0_1px_rgba(15,23,42,0.06),0_4px_16px_rgba(15,23,42,0.08),0_20px_40px_-4px_rgba(15,23,42,0.16),0_32px_64px_-8px_rgba(15,23,42,0.16)] hover:-translate-y-1 transition-all duration-200">
                <div className="flex items-center gap-2 mb-4 text-left">
                  <Image
                    src="/assets/clay/phone.png"
                    alt="기본 정보"
                    width={32}
                    height={32}
                    className="w-8 h-8 sm:w-8 sm:h-8 object-contain shrink-0"
                  />
                  <div>
                    <h2 className="text-base font-bold text-ink">기본 정보</h2>
                    <p className="text-xs text-muted mt-0.5">
                      근무 배정 확인 및 계약서 작성에 활용돼요.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <div>
                    <label htmlFor="crew-fullname" className="block text-sm font-semibold text-muted mb-2 text-left">
                      이름 <span className="text-brand">*</span>
                    </label>
                    <input
                      id="crew-fullname"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="실명을 입력해 주세요"
                      className="w-full h-12 px-4 rounded-xl border border-border/80 bg-white text-ink text-sm font-semibold focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="crew-phone" className="block text-sm font-semibold text-muted mb-2 text-left">
                      연락처 <span className="text-brand">*</span>
                    </label>
                    <input
                      id="crew-phone"
                      type="tel"
                      required
                      maxLength={13}
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      placeholder="010-0000-0000"
                      className="w-full h-12 px-4 rounded-xl border border-border/80 bg-white text-ink text-sm font-mono font-semibold focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
                    />
                  </div>
                </div>

                {email && (
                  <div className="pt-3 border-t border-border-subtle flex items-center justify-between text-xs text-muted">
                    <span>로그인 계정</span>
                    <span className="font-mono text-ink font-medium">{email}</span>
                  </div>
                )}
              </section>

              {/* 4. 유니폼 영역 ("유니폼 핏을 맞춰볼까요?") */}
              <section className="bg-white rounded-3xl p-5 sm:p-6 shadow-[0_0_0_1px_rgba(15,23,42,0.04),0_2px_8px_rgba(15,23,42,0.06),0_12px_28px_-4px_rgba(15,23,42,0.12),0_24px_48px_-8px_rgba(15,23,42,0.12)] hover:shadow-[0_0_0_1px_rgba(15,23,42,0.06),0_4px_16px_rgba(15,23,42,0.08),0_20px_40px_-4px_rgba(15,23,42,0.16),0_32px_64px_-8px_rgba(15,23,42,0.16)] hover:-translate-y-1 transition-all duration-200">
                <div className="flex items-center gap-2 mb-4 text-left">
                  <Image
                    src="/assets/clay/shirt.png"
                    alt="유니폼 규격"
                    width={32}
                    height={32}
                    className="w-8 h-8 sm:w-8 sm:h-8 object-contain shrink-0"
                  />
                  <div>
                    <h2 className="text-base font-bold text-ink">유니폼 핏을 맞춰볼까요?</h2>
                    <p className="text-xs text-muted mt-0.5 break-keep">
                      행사 당일 딱 맞는 근무복을 준비해 드릴게요.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:gap-5">
                  {/* 키 (cm) */}
                  <div>
                    <label htmlFor="crew-height" className="block text-sm font-semibold text-muted mb-2 text-left">
                      키 (cm)
                    </label>
                    <div className="relative">
                      <input
                        id="crew-height"
                        type="number"
                        min={140}
                        max={210}
                        value={heightCm}
                        onChange={(e) => setHeightCm(e.target.value)}
                        placeholder="예: 175"
                        className="w-full h-12 px-4 pr-11 rounded-xl border border-border/80 bg-white text-ink text-sm font-semibold focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted font-semibold text-xs pointer-events-none">
                        cm
                      </span>
                    </div>
                  </div>

                  {/* 상의 유니폼 사이즈 (Top Size 칩) */}
                  <div>
                    <label className="block text-sm font-semibold text-muted mb-2 text-left">
                      상의 유니폼 사이즈
                    </label>
                    <div className="grid grid-cols-5 gap-1 sm:gap-1.5 h-12">
                      {TOP_SIZES.map((size) => {
                        const isSelected = topSize === size;
                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setTopSize(size)}
                            className={cn(
                              'h-12 rounded-xl border text-center font-bold text-[11px] sm:text-xs transition-colors cursor-pointer flex items-center justify-center p-0',
                              isSelected
                                ? 'bg-brand text-white border-brand shadow-xs'
                                : 'bg-white text-ink border-border/80 hover:border-brand-border'
                            )}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 하의 사이즈 (CustomSelect 적용) */}
                  <div>
                    <label htmlFor="crew-bottom" className="block text-sm font-semibold text-muted mb-2 text-left">
                      하의 사이즈
                    </label>
                    <CustomSelect
                      id="crew-bottom"
                      value={bottomSize}
                      options={BOTTOM_SIZE_OPTIONS}
                      onChange={(val) => setBottomSize(val)}
                    />
                  </div>

                  {/* 신발 사이즈 (CustomSelect 적용) */}
                  <div>
                    <label htmlFor="crew-shoes" className="block text-sm font-semibold text-muted mb-2 text-left">
                      신발 사이즈 (mm)
                    </label>
                    <CustomSelect
                      id="crew-shoes"
                      value={Number(shoeSizeMm)}
                      options={SHOE_SIZE_OPTIONS}
                      onChange={(val) => setShoeSizeMm(val)}
                    />
                  </div>
                </div>
              </section>

              {/* 5. 경력/소개 ("현장 경험이 있다면 알려주세요") */}
              <section className="bg-white rounded-3xl p-5 sm:p-6 shadow-[0_0_0_1px_rgba(15,23,42,0.04),0_2px_8px_rgba(15,23,42,0.06),0_12px_28px_-4px_rgba(15,23,42,0.12),0_24px_48px_-8px_rgba(15,23,42,0.12)] hover:shadow-[0_0_0_1px_rgba(15,23,42,0.06),0_4px_16px_rgba(15,23,42,0.08),0_20px_40px_-4px_rgba(15,23,42,0.16),0_32px_64px_-8px_rgba(15,23,42,0.16)] hover:-translate-y-1 transition-all duration-200">
                <div className="flex items-center gap-2 mb-4 text-left">
                  <Image
                    src="/assets/clay/quote.png"
                    alt="현장 경험"
                    width={32}
                    height={32}
                    className="w-8 h-8 sm:w-8 sm:h-8 object-contain shrink-0"
                  />
                  <div>
                    <h2 className="text-base font-bold text-ink">현장 경험이 있다면 알려주세요</h2>
                    <p className="text-xs text-muted mt-0.5 break-keep">
                      솔직한 소개는 주최사의 매칭 신뢰도를 높여줘요.
                    </p>
                  </div>
                </div>

                <div className="space-y-4 sm:space-y-5">
                  {/* 행사 스태프 경력 (CustomSelect 적용) */}
                  <div>
                    <label htmlFor="crew-exp" className="block text-sm font-semibold text-muted mb-2 text-left">
                      행사 스태프 경력
                    </label>
                    <CustomSelect
                      id="crew-exp"
                      value={Number(experienceYears)}
                      options={experienceOptions}
                      onChange={(val) => setExperienceYears(val)}
                    />
                  </div>

                  {/* 한 줄 소개 및 각오 (Bio) */}
                  <div>
                    <label htmlFor="crew-bio" className="block text-sm font-semibold text-muted mb-2 text-left">
                      한 줄 소개 및 각오
                    </label>
                    <textarea
                      id="crew-bio"
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="예: 약속은 철저하게 지키며 불평 불만 없이 주도적인 마인드로 업무에 집중합니다."
                      className="w-full p-4 rounded-xl border border-border/80 bg-white text-ink text-sm placeholder:text-sm leading-relaxed focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors resize-none"
                    />
                  </div>
                </div>
              </section>

              {/* 6. 외국어 영역 ("외국어 응대가 가능한가요? (선택)") */}
              <section className="bg-white rounded-3xl p-5 sm:p-6 shadow-[0_0_0_1px_rgba(15,23,42,0.04),0_2px_8px_rgba(15,23,42,0.06),0_12px_28px_-4px_rgba(15,23,42,0.12),0_24px_48px_-8px_rgba(15,23,42,0.12)] hover:shadow-[0_0_0_1px_rgba(15,23,42,0.06),0_4px_16px_rgba(15,23,42,0.08),0_20px_40px_-4px_rgba(15,23,42,0.16),0_32px_64px_-8px_rgba(15,23,42,0.16)] hover:-translate-y-1 transition-all duration-200">
                <div className="flex items-center gap-2 mb-4 text-left">
                  <Image
                    src="/assets/clay/language.png"
                    alt="외국어 능력"
                    width={32}
                    height={32}
                    className="w-8 h-8 sm:w-8 sm:h-8 object-contain shrink-0"
                  />
                  <div>
                    <h2 className="text-base font-bold text-ink">외국어 응대가 가능한가요? (선택)</h2>
                    <p className="text-xs text-muted mt-0.5 break-keep">
                      글로벌 팝업이나 전시 박람회에 우선 배정될 수 있어요.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-1.5 sm:gap-2 pt-1">
                  {AVAILABLE_LANGUAGES.map((lang) => {
                    const isSelected = languages.includes(lang);
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => toggleLanguage(lang)}
                        className={cn(
                          'h-10 px-1 sm:px-2 rounded-xl sm:rounded-2xl border text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 select-none',
                          isSelected
                            ? 'bg-brand text-white border-brand shadow-xs'
                            : 'bg-white text-ink border-border/80 hover:border-brand-border'
                        )}
                      >
                        {isSelected && <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white shrink-0" />}
                        <span className="truncate">{lang}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* 7. 저장 버튼 */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isFormDisabled || !fullName.trim()}
                  className={cn(
                    'w-full h-[52px] rounded-2xl text-white font-bold text-base shadow-sm transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer bg-brand hover:bg-brand-hover',
                    (isFormDisabled || !fullName.trim()) && 'opacity-60 cursor-not-allowed'
                  )}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>프로필 저장하는 중…</span>
                    </>
                  ) : isSavedSuccess ? (
                    <div className="flex items-center gap-1.5 text-white animate-in zoom-in-95 duration-150">
                      <Check className="w-5 h-5 stroke-[2.5]" />
                      <span>저장완료</span>
                    </div>
                  ) : (
                    <span>프로필 저장하기</span>
                  )}
                </button>
              </div>

              {/* 8. 보안 및 개인정보 분리 보관 안내 */}
              <div className="p-5 rounded-3xl bg-white shadow-[0_0_0_1px_rgba(15,23,42,0.04),0_2px_8px_rgba(15,23,42,0.06),0_12px_28px_-4px_rgba(15,23,42,0.12),0_24px_48px_-8px_rgba(15,23,42,0.12)] hover:shadow-[0_0_0_1px_rgba(15,23,42,0.06),0_4px_16px_rgba(15,23,42,0.08),0_20px_40px_-4px_rgba(15,23,42,0.16),0_32px_64px_-8px_rgba(15,23,42,0.16)] hover:-translate-y-1 transition-all duration-200 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-ink">
                  <Lock className="w-3.5 h-3.5 text-brand" />
                  <span>개인정보 분리 보관 원칙</span>
                </div>
                <p className="text-[11px] text-muted leading-relaxed break-keep">
                  크루링크는 주민등록번호 원문을 데이터베이스에 보관하지 않으며, 공인 세무 파트너사의 암호화 식별키를 통해 안전하게 3.3% 원천징수 정산을 처리합니다.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* 모바일 퍼스트 로그인 모달 */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        redirectTo="/crew/profile"
        onSuccess={fetchProfile}
      />
    </>
  );
}
