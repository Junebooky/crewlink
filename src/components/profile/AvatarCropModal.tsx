'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, ZoomIn, ZoomOut, RotateCcw, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AvatarCropModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onCropComplete: (croppedBlob: Blob) => Promise<void> | void;
  isUploading?: boolean;
}

const CONTAINER_SIZE = 280; // UI 컨테이너 크기 (px)
const CIRCLE_SIZE = 240; // 크롭 원형 지름 (px)
const OUTPUT_SIZE = 600; // 출력 캔버스 해상도 (px)
const SCALE_RATIO = OUTPUT_SIZE / CIRCLE_SIZE; // 2.5

export function AvatarCropModal({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
  isUploading = false,
}: AvatarCropModalProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [imgLoaded, setImgLoaded] = useState(false);
  const [naturalDim, setNaturalDim] = useState({ width: 0, height: 0 });

  const imageRef = useRef<HTMLImageElement | null>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Mobile multi-touch pinch-to-zoom state refs
  const isPinching = useRef(false);
  const pinchStartDist = useRef(0);
  const pinchStartZoom = useRef(1);
  const pinchStartCenter = useRef({ x: 0, y: 0 });
  const pinchStartPan = useRef({ x: 0, y: 0 });

  // Helper to calculate distance between two touch points
  const getTouchDistance = (t1: React.Touch, t2: React.Touch) => {
    return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
  };

  // Helper to calculate midpoint between two touch points
  const getTouchCenter = (t1: React.Touch, t2: React.Touch) => {
    return {
      x: (t1.clientX + t2.clientX) / 2,
      y: (t1.clientY + t2.clientY) / 2,
    };
  };

  // Calculate base scale to fully cover CIRCLE_SIZE
  const baseScale =
    naturalDim.width > 0 && naturalDim.height > 0
      ? Math.max(CIRCLE_SIZE / naturalDim.width, CIRCLE_SIZE / naturalDim.height)
      : 1;

  const currentWidth = naturalDim.width * baseScale * zoom;
  const currentHeight = naturalDim.height * baseScale * zoom;

  // Max pan bounds so the image always covers the circle
  const maxPanX = Math.max(0, (currentWidth - CIRCLE_SIZE) / 2);
  const maxPanY = Math.max(0, (currentHeight - CIRCLE_SIZE) / 2);

  const getMaxPanForZoom = useCallback(
    (targetZoom: number) => {
      const w = naturalDim.width * baseScale * targetZoom;
      const h = naturalDim.height * baseScale * targetZoom;
      return {
        maxX: Math.max(0, (w - CIRCLE_SIZE) / 2),
        maxY: Math.max(0, (h - CIRCLE_SIZE) / 2),
      };
    },
    [naturalDim.width, naturalDim.height, baseScale]
  );

  const clampAndSetPan = useCallback(
    (newX: number, newY: number) => {
      const clampedX = Math.max(-maxPanX, Math.min(maxPanX, newX));
      const clampedY = Math.max(-maxPanY, Math.min(maxPanY, newY));
      setPan({ x: clampedX, y: clampedY });
    },
    [maxPanX, maxPanY]
  );

  // Clamp pan whenever zoom or bounds change
  useEffect(() => {
    clampAndSetPan(pan.x, pan.y);
  }, [zoom, maxPanX, maxPanY, clampAndSetPan, pan.x, pan.y]);

  // Reset state when opening or source changes
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setImgLoaded(false);
      isDragging.current = false;
      isPinching.current = false;
    }
  }, [isOpen, imageSrc]);

  // Image load handler
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalDim({ width: img.naturalWidth, height: img.naturalHeight });
    setImgLoaded(true);
    setPan({ x: 0, y: 0 });
    setZoom(1);
  };

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragStart.current = {
      x: e.clientX - pan.x,
      y: e.clientY - pan.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const newX = e.clientX - dragStart.current.x;
    const newY = e.clientY - dragStart.current.y;
    clampAndSetPan(newX, newY);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  // Touch drag & mobile pinch-to-zoom multi-touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // 2 fingers: pinch-to-zoom & simultaneous two-finger repositioning
      isDragging.current = false;
      isPinching.current = true;
      pinchStartDist.current = getTouchDistance(e.touches[0], e.touches[1]);
      pinchStartZoom.current = zoom;
      pinchStartCenter.current = getTouchCenter(e.touches[0], e.touches[1]);
      pinchStartPan.current = { x: pan.x, y: pan.y };
    } else if (e.touches.length === 1) {
      // 1 finger: drag/pan
      isPinching.current = false;
      isDragging.current = true;
      dragStart.current = {
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && isPinching.current) {
      if (pinchStartDist.current <= 0) return;
      const currentDist = getTouchDistance(e.touches[0], e.touches[1]);
      const factor = currentDist / pinchStartDist.current;
      const newZoom = Math.min(3, Math.max(1, Number((pinchStartZoom.current * factor).toFixed(3))));
      setZoom(newZoom);

      // Seamless two-finger pan while pinching
      const currentCenter = getTouchCenter(e.touches[0], e.touches[1]);
      const deltaX = currentCenter.x - pinchStartCenter.current.x;
      const deltaY = currentCenter.y - pinchStartCenter.current.y;

      const bounds = getMaxPanForZoom(newZoom);
      const clampedX = Math.max(-bounds.maxX, Math.min(bounds.maxX, pinchStartPan.current.x + deltaX));
      const clampedY = Math.max(-bounds.maxY, Math.min(bounds.maxY, pinchStartPan.current.y + deltaY));
      setPan({ x: clampedX, y: clampedY });
    } else if (e.touches.length === 1 && isDragging.current && !isPinching.current) {
      const newX = e.touches[0].clientX - dragStart.current.x;
      const newY = e.touches[0].clientY - dragStart.current.y;
      clampAndSetPan(newX, newY);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      pinchStartDist.current = getTouchDistance(e.touches[0], e.touches[1]);
      pinchStartZoom.current = zoom;
      pinchStartCenter.current = getTouchCenter(e.touches[0], e.touches[1]);
      pinchStartPan.current = { x: pan.x, y: pan.y };
    } else if (e.touches.length === 1) {
      // Seamless fallback to single-finger drag without jerking
      isPinching.current = false;
      isDragging.current = true;
      dragStart.current = {
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      };
    } else {
      isDragging.current = false;
      isPinching.current = false;
    }
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.002;
    setZoom((prev) => Math.min(3, Math.max(1, prev + delta)));
  };

  // Reset positioning & zoom
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Export cropped image via Canvas
  const handleComplete = async () => {
    if (!imageRef.current) return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw high quality image
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Calculate placement on canvas
      const targetWidth = currentWidth * SCALE_RATIO;
      const targetHeight = currentHeight * SCALE_RATIO;
      const canvasX = OUTPUT_SIZE / 2 - targetWidth / 2 + pan.x * SCALE_RATIO;
      const canvasY = OUTPUT_SIZE / 2 - targetHeight / 2 + pan.y * SCALE_RATIO;

      ctx.drawImage(imageRef.current, canvasX, canvasY, targetWidth, targetHeight);

      canvas.toBlob(
        async (blob) => {
          if (blob) {
            await onCropComplete(blob);
          }
        },
        'image/jpeg',
        0.9
      );
    } catch (err) {
      console.error('[Avatar crop export failed]:', err);
    }
  };

  const imgLeft = CONTAINER_SIZE / 2 - currentWidth / 2 + pan.x;
  const imgTop = CONTAINER_SIZE / 2 - currentHeight / 2 + pan.y;

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && !isUploading && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in" />
        <Dialog.Content className="fixed z-50 top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[92vw] max-w-[420px] rounded-3xl bg-white border border-border-subtle p-5 sm:p-6 shadow-2xl focus:outline-none animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
            <div>
              <Dialog.Title className="text-lg font-bold text-ink">
                프로필 사진 맞추기
              </Dialog.Title>
              <Dialog.Description className="text-xs text-muted mt-0.5">
                원 안에 얼굴이 뚜렷하게 보이도록 조절해 주세요.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                disabled={isUploading}
                className="w-8 h-8 rounded-full bg-surface-muted hover:bg-border text-muted hover:text-ink flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
                aria-label="닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          {/* Interactive Crop Viewport */}
          <div className="py-4 flex flex-col items-center">
            <div
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
              onWheel={handleWheel}
              style={{ width: CONTAINER_SIZE, height: CONTAINER_SIZE }}
              className="relative overflow-hidden rounded-2xl bg-slate-950 select-none touch-none cursor-grab active:cursor-grabbing shadow-inner flex items-center justify-center"
            >
              {/* Image element */}
              {imageSrc && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  ref={imageRef}
                  src={imageSrc}
                  alt="편집 중인 사진"
                  crossOrigin="anonymous"
                  onLoad={handleImageLoad}
                  draggable={false}
                  style={{
                    position: 'absolute',
                    left: `${imgLeft}px`,
                    top: `${imgTop}px`,
                    width: `${currentWidth}px`,
                    height: `${currentHeight}px`,
                    maxWidth: 'none',
                    maxHeight: 'none',
                    opacity: imgLoaded ? 1 : 0,
                    transition: isDragging.current || isPinching.current ? 'none' : 'opacity 0.2s',
                  }}
                  className="pointer-events-none select-none"
                />
              )}

              {/* Circular boundary ring & vignette cutout */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div
                  style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }}
                  className="rounded-full border-2 border-white/90 shadow-[0_0_0_9999px_rgba(15,23,42,0.6)]"
                />
              </div>

              {!imgLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950 text-white z-10">
                  <Loader2 className="w-6 h-6 animate-spin text-brand" />
                </div>
              )}
            </div>

            <p className="text-[11px] text-muted text-center mt-2">
              사진을 드래그하거나 두 손가락으로 확대·축소할 수 있어요.
            </p>

            {/* Zoom Controls */}
            <div className="w-full max-w-[280px] mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setZoom((prev) => Math.max(1, prev - 0.2))}
                className="w-7 h-7 rounded-lg bg-surface-muted hover:bg-border text-muted hover:text-ink flex items-center justify-center transition-colors cursor-pointer shrink-0"
                aria-label="축소"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <input
                type="range"
                min="1"
                max="3"
                step="0.02"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-surface-muted rounded-lg appearance-none cursor-pointer accent-brand"
                aria-label="사진 확대 및 축소"
              />

              <button
                type="button"
                onClick={() => setZoom((prev) => Math.min(3, prev + 0.2))}
                className="w-7 h-7 rounded-lg bg-surface-muted hover:bg-border text-muted hover:text-ink flex items-center justify-center transition-colors cursor-pointer shrink-0"
                aria-label="확대"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleReset}
                title="가운데 맞춤"
                className="w-7 h-7 rounded-lg bg-surface-muted hover:bg-border text-muted hover:text-ink flex items-center justify-center transition-colors cursor-pointer shrink-0"
                aria-label="가운데 맞춤"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-border-subtle flex items-center gap-2">
            <button
              type="button"
              disabled={isUploading}
              onClick={onClose}
              className="flex-1 h-11 rounded-xl border border-border bg-white hover:bg-canvas text-xs font-bold text-muted hover:text-ink transition-colors cursor-pointer disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="button"
              disabled={isUploading || !imgLoaded}
              onClick={handleComplete}
              className={cn(
                'flex-1 h-11 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-[0.99]',
                (isUploading || !imgLoaded) && 'opacity-60 cursor-not-allowed'
              )}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>적용 중…</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>완료</span>
                </>
              )}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
