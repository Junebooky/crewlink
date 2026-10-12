'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { AppShell } from '@/components/common/AppShell';
import {
  User,
  Camera,
  Shirt,
  Ruler,
  Footprints,
  Clock,
  Globe2,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  UploadCloud,
  FileCheck2,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const TOP_SIZES = ['S', 'M', 'L', 'XL', '2XL'];
const BOTTOM_SIZES = ['26', '28', '30', '32', '34', '36', '38'];
const SHOE_SIZES = [230, 235, 240, 245, 250, 255, 260, 265, 270, 275, 280, 285, 290];
const AVAILABLE_LANGUAGES = ['한국어', '영어', '일본어', '중국어'];

export default function CrewProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingFullBody, setUploadingFullBody] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // Form states
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [fullBodyImageUrl, setFullBodyImageUrl] = useState<string | null>(null);
  const [heightCm, setHeightCm] = useState<number | string>('');
  const [topSize, setTopSize] = useState('L');
  const [bottomSize, setBottomSize] = useState('30');
  const [shoeSizeMm, setShoeSizeMm] = useState<number | string>(265);
  const [experienceYears, setExperienceYears] = useState<number | string>(1);
  const [bio, setBio] = useState('');
  const [languages, setLanguages] = useState<string[]>(['한국어']);
  const [ratingAvg, setRatingAvg] = useState(5.0);
  const [totalShiftsCompleted, setTotalShiftsCompleted] = useState(0);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const fullBodyInputRef = useRef<HTMLInputElement>(null);

  // Load profile from API on mount
  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        const res = await fetch('/api/crew/profile', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.profile) {
            setFullName(data.fullName || '');
            setPhoneNumber(data.phoneNumber || '');
            setEmail(data.email || '');
            setProfileImageUrl(data.profile.profileImageUrl || null);
            setFullBodyImageUrl(data.profile.fullBodyImageUrl || null);
            setHeightCm(data.profile.heightCm || '');
            setTopSize(data.profile.topSize || 'L');
            setBottomSize(data.profile.bottomSize || '30');
            setShoeSizeMm(data.profile.shoeSizeMm || 265);
            setExperienceYears(data.profile.experienceYears ?? 1);
            setBio(data.profile.bio || '');
            setLanguages(data.profile.languages || ['한국어']);
            setRatingAvg(data.profile.ratingAvg ?? 5.0);
            setTotalShiftsCompleted(data.profile.totalShiftsCompleted ?? 0);
          }
        }
      } catch (err) {
        console.error('[Failed to fetch crew profile]:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  // Handle phone formatting
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

  // Upload photo handler
  const handleUploadPhoto = async (file: File, type: 'avatar' | 'full_body') => {
    if (type === 'avatar') setUploadingAvatar(true);
    else setUploadingFullBody(true);
    setFeedback(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const res = await fetch('/api/crew/profile/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || '사진 업로드에 실패했습니다.');
      }

      if (type === 'avatar') {
        setProfileImageUrl(data.url);
      } else {
        setFullBodyImageUrl(data.url);
      }
      setFeedback({ type: 'success', message: '사진이 성공적으로 업로드되었습니다.' });
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: (err as Error).message || '사진 업로드 중 오류가 발생했습니다.',
      });
    } finally {
      if (type === 'avatar') setUploadingAvatar(false);
      else setUploadingFullBody(false);
    }
  };

  // Language toggle
  const toggleLanguage = (lang: string) => {
    setLanguages((prev) =>
      prev.includes(lang)
        ? prev.length > 1
          ? prev.filter((l) => l !== lang)
          : prev
        : [...prev, lang]
    );
  };

  // Submit form handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/crew/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          phoneNumber,
          profileImageUrl,
          fullBodyImageUrl,
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
        throw new Error(data.message || '프로필 정보 저장에 실패했습니다.');
      }

      setFeedback({ type: 'success', message: '프로필 정보가 안전하게 저장되었습니다.' });
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: (err as Error).message || '저장 중 오류가 발생했습니다.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell initialRole="crew">
      <div className="max-w-2xl mx-auto px-4 py-6 w-full space-y-6 pb-24">
        {/* 1. Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border pb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight">
              크루 프로필 & 신체 스펙
            </h1>
            <p className="text-xs text-muted mt-1 break-keep">
              주최사가 행사 배정 시 검토하는 공식 프로필입니다. 단정한 착장 사진과 정확한 스펙을 입력해 주세요.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-soft border border-brand-border text-brand-strong text-xs font-semibold shrink-0 self-start sm:self-auto">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>주최사 검토용 공식 프로필</span>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={cn(
              'p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 animate-in fade-in duration-200',
              feedback.type === 'success'
                ? 'bg-brand-soft border-brand-border text-brand-strong font-medium'
                : 'bg-surface border-border text-ink'
            )}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-brand shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-muted shrink-0 mt-0.5" />
            )}
            <span className="leading-relaxed">{feedback.message}</span>
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center space-y-3">
            <Loader2 className="w-7 h-7 text-brand animate-spin mx-auto" />
            <p className="text-xs text-muted">프로필 정보를 불러오는 중입니다…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 2. Visual Profile Media Section */}
            <section className="bg-surface border border-border rounded-3xl p-5 sm:p-6 space-y-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-ink">공식 착장 & 프로필 사진</h2>
                  <p className="text-xs text-muted mt-0.5">
                    행사 유니폼 배정과 주최사 적합도 확인에 사용됩니다.
                  </p>
                </div>
                <span className="text-[11px] text-muted font-medium bg-canvas px-2.5 py-1 rounded-lg border border-border">
                  최대 5MB
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 상반신 프로필 사진 */}
                <div className="bg-canvas border border-border/80 rounded-2xl p-4 flex flex-col items-center text-center space-y-3">
                  <span className="text-xs font-bold text-ink">1. 상반신 프로필</span>
                  <div className="relative w-24 h-24 rounded-full overflow-hidden bg-surface border-2 border-border shadow-xs group">
                    {profileImageUrl ? (
                      <Image
                        src={profileImageUrl}
                        alt="상반신 프로필"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-brand-soft text-brand-strong">
                        <User className="w-10 h-10 stroke-[1.5]" />
                      </div>
                    )}

                    {uploadingAvatar && (
                      <div className="absolute inset-0 bg-ink/50 backdrop-blur-2xs flex items-center justify-center text-white">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                    )}
                  </div>

                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadPhoto(file, 'avatar');
                    }}
                  />

                  <button
                    type="button"
                    disabled={uploadingAvatar}
                    onClick={() => avatarInputRef.current?.click()}
                    className="h-8 px-3.5 rounded-xl border border-border bg-surface hover:border-brand-border text-xs font-semibold text-ink flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Camera className="w-3.5 h-3.5 text-muted" />
                    <span>{profileImageUrl ? '사진 변경' : '상반신 사진 등록'}</span>
                  </button>
                  <p className="text-[11px] text-muted break-keep">
                    얼굴이 밝고 선명하게 나온 사진
                  </p>
                </div>

                {/* 단정한 착장 전신 사진 */}
                <div className="bg-canvas border border-border/80 rounded-2xl p-4 flex flex-col items-center text-center space-y-3">
                  <div className="flex items-center gap-1 text-xs font-bold text-ink">
                    <span>2. 단정한 착장 전신 사진</span>
                    <span className="text-brand">*</span>
                  </div>

                  <div className="relative w-28 h-36 rounded-2xl overflow-hidden bg-surface border-2 border-dashed border-border flex items-center justify-center shadow-xs">
                    {fullBodyImageUrl ? (
                      <>
                        <Image
                          src={fullBodyImageUrl}
                          alt="전신 착장 사진"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFullBodyImageUrl(null);
                          }}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-ink/60 text-white flex items-center justify-center hover:bg-ink transition-colors cursor-pointer"
                          aria-label="사진 삭제"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <div className="p-3 text-center space-y-1 text-muted">
                        <UploadCloud className="w-7 h-7 mx-auto stroke-[1.5] text-brand" />
                        <span className="text-[11px] block leading-tight font-medium">
                          전신 착장 미등록
                        </span>
                      </div>
                    )}

                    {uploadingFullBody && (
                      <div className="absolute inset-0 bg-ink/50 backdrop-blur-2xs flex items-center justify-center text-white">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                    )}
                  </div>

                  <input
                    ref={fullBodyInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadPhoto(file, 'full_body');
                    }}
                  />

                  <button
                    type="button"
                    disabled={uploadingFullBody}
                    onClick={() => fullBodyInputRef.current?.click()}
                    className="h-8 px-3.5 rounded-xl border border-border bg-surface hover:border-brand-border text-xs font-semibold text-ink flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Camera className="w-3.5 h-3.5 text-muted" />
                    <span>{fullBodyImageUrl ? '전신 사진 변경' : '전신 착장 사진 등록'}</span>
                  </button>
                  <p className="text-[11px] text-muted break-keep">
                    단정한 블랙 정장 또는 슬랙스 착장 추천
                  </p>
                </div>
              </div>
            </section>

            {/* 3. 기본 인적사항 섹션 */}
            <section className="bg-surface border border-border rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xs">
              <h2 className="text-sm font-bold text-ink">기본 인적사항</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label htmlFor="crew-fullname" className="font-semibold text-ink">
                    이름 <span className="text-brand">*</span>
                  </label>
                  <input
                    id="crew-fullname"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="실명을 입력해 주세요"
                    className="w-full h-11 px-3.5 rounded-xl border border-border bg-canvas text-ink text-sm font-medium focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="crew-phone" className="font-semibold text-ink">
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
                    className="w-full h-11 px-3.5 rounded-xl border border-border bg-canvas text-ink text-sm font-mono focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
                  />
                </div>
              </div>

              {email && (
                <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-xs text-muted">
                  <span>로그인 계정 이메일</span>
                  <span className="font-mono text-ink font-medium">{email}</span>
                </div>
              )}
            </section>

            {/* 4. 신체 스펙 및 유니폼 사이즈 섹션 */}
            <section className="bg-surface border border-border rounded-3xl p-5 sm:p-6 space-y-5 shadow-2xs">
              <div>
                <h2 className="text-sm font-bold text-ink">신체 스펙 & 유니폼 규격</h2>
                <p className="text-xs text-muted mt-0.5">
                  현장 행사 맞춤 단체복/명찰 및 근무 동선 배정에 필수적으로 사용됩니다.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* 키 (cm) */}
                <div className="space-y-1.5">
                  <label htmlFor="crew-height" className="font-semibold text-ink flex items-center gap-1.5">
                    <Ruler className="w-3.5 h-3.5 text-brand" />
                    <span>키 (cm)</span>
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
                      className="w-full h-11 px-3.5 pr-10 rounded-xl border border-border bg-canvas text-ink text-sm font-semibold focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted font-bold text-xs pointer-events-none">
                      cm
                    </span>
                  </div>
                </div>

                {/* 하의 치수 (Bottom) */}
                <div className="space-y-1.5">
                  <label htmlFor="crew-bottom" className="font-semibold text-ink flex items-center gap-1.5">
                    <Shirt className="w-3.5 h-3.5 text-brand" />
                    <span>하의 슬랙스/허리 사이즈 (inch)</span>
                  </label>
                  <select
                    id="crew-bottom"
                    value={bottomSize}
                    onChange={(e) => setBottomSize(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-border bg-canvas text-ink text-sm font-semibold focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors cursor-pointer"
                  >
                    {BOTTOM_SIZES.map((size) => (
                      <option key={size} value={size}>
                        {size} 인치 (슬랙스)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 상의 유니폼 사이즈 (Top Size 칩) */}
              <div className="space-y-2 text-xs">
                <span className="font-semibold text-ink flex items-center gap-1.5">
                  <Shirt className="w-3.5 h-3.5 text-brand" />
                  <span>상의 유니폼 사이즈 (Top)</span>
                </span>
                <div className="grid grid-cols-5 gap-2">
                  {TOP_SIZES.map((size) => {
                    const isSelected = topSize === size;
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setTopSize(size)}
                        className={cn(
                          'h-10 rounded-xl border text-center font-bold text-xs transition-colors cursor-pointer flex items-center justify-center',
                          isSelected
                            ? 'bg-brand text-inverse border-brand shadow-xs'
                            : 'bg-canvas text-muted border-border hover:border-brand-border'
                        )}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 신발 사이즈 & 경력 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* 신발 사이즈 */}
                <div className="space-y-1.5">
                  <label htmlFor="crew-shoes" className="font-semibold text-ink flex items-center gap-1.5">
                    <Footprints className="w-3.5 h-3.5 text-brand" />
                    <span>신발 치수 (단화/운동화)</span>
                  </label>
                  <select
                    id="crew-shoes"
                    value={shoeSizeMm}
                    onChange={(e) => setShoeSizeMm(Number(e.target.value))}
                    className="w-full h-11 px-3.5 rounded-xl border border-border bg-canvas text-ink text-sm font-semibold focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors cursor-pointer"
                  >
                    {SHOE_SIZES.map((sz) => (
                      <option key={sz} value={sz}>
                        {sz} mm
                      </option>
                    ))}
                  </select>
                </div>

                {/* 현장 경력 연수 */}
                <div className="space-y-1.5">
                  <label htmlFor="crew-exp" className="font-semibold text-ink flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-brand" />
                    <span>행사 스태프 경력 (년)</span>
                  </label>
                  <input
                    id="crew-exp"
                    type="number"
                    step="0.5"
                    min="0"
                    max="15"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    placeholder="예: 1.5"
                    className="w-full h-11 px-3.5 rounded-xl border border-border bg-canvas text-ink text-sm font-semibold focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
                  />
                </div>
              </div>

              {/* 외국어 구사 능력 */}
              <div className="space-y-2 text-xs">
                <span className="font-semibold text-ink flex items-center gap-1.5">
                  <Globe2 className="w-3.5 h-3.5 text-brand" />
                  <span>외국어 응대 가능 여부</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_LANGUAGES.map((lang) => {
                    const isSelected = languages.includes(lang);
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => toggleLanguage(lang)}
                        className={cn(
                          'h-9 px-3.5 rounded-full border text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5',
                          isSelected
                            ? 'bg-brand text-inverse border-brand shadow-xs'
                            : 'bg-canvas text-muted border-border hover:border-brand-border'
                        )}
                      >
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                        <span>{lang}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* 5. 한 줄 소개 및 각오 (Bio) */}
            <section className="bg-surface border border-border rounded-3xl p-5 sm:p-6 space-y-3 shadow-2xs">
              <label htmlFor="crew-bio" className="block text-sm font-bold text-ink">
                한 줄 소개 및 현장 각오
              </label>
              <textarea
                id="crew-bio"
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="예: 밝은 미소와 신속한 응대로 행사의 품격을 높이는 크루입니다."
                className="w-full p-3.5 rounded-xl border border-border bg-canvas text-ink text-xs leading-relaxed focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors resize-none"
              />
            </section>

            {/* 6. 저장 버튼 */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={saving || !fullName.trim()}
                className="w-full h-12 rounded-2xl bg-brand hover:bg-brand-hover disabled:bg-surface-muted disabled:text-muted disabled:border disabled:border-border text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed active:scale-[0.99]"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>프로필 저장 중…</span>
                  </>
                ) : (
                  <span>프로필 정보 저장하기</span>
                )}
              </button>
            </div>

            {/* 7. 보안 및 개인정보 분리 안내 카드 */}
            <div className="p-4 rounded-2xl bg-canvas border border-border text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-ink">
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
    </AppShell>
  );
}
