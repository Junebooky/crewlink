'use client';

import React, { useRef, useState, useEffect } from 'react';
import { PenTool, RotateCcw, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import palette from '@/lib/tokens/palette.json';

export interface StrokePoint {
  x: number;
  y: number;
  time: number;
}

export type Stroke = StrokePoint[];
export type SignatureStroke = Stroke;

export interface SignatureCaptureProps {
  value?: Stroke[];
  onChange?: (strokes: Stroke[]) => void;
  height?: number;
  className?: string;
  disabled?: boolean;
}

export function SignatureCapture({
  value,
  onChange,
  height = 160,
  className,
  disabled = false,
}: SignatureCaptureProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const currentStrokeRef = useRef<StrokePoint[]>([]);

  // Redraw canvas from stroke coordinates
  const redraw = (currentStrokes: Stroke[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = palette.ink;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    currentStrokes.forEach((stroke) => {
      if (stroke.length === 0) return;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);

      if (stroke.length === 1) {
        ctx.lineTo(stroke[0].x + 0.1, stroke[0].y + 0.1);
      } else {
        for (let i = 1; i < stroke.length; i++) {
          ctx.lineTo(stroke[i].x, stroke[i].y);
        }
      }
      ctx.stroke();
    });

    ctx.restore();
  };

  // Resize canvas when container dimensions change
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      const displayWidth = rect.width;
      const displayHeight = height;

      canvas.width = displayWidth * dpr;
      canvas.height = displayHeight * dpr;
      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;

      redraw(strokes);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [height, strokes]);

  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ): StrokePoint | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
      time: Date.now(),
    };
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (disabled) return;
    const pt = getCoordinates(e);
    if (!pt) return;

    setIsDrawing(true);
    currentStrokeRef.current = [pt];

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const dpr = window.devicePixelRatio || 1;
        ctx.save();
        ctx.scale(dpr, dpr);
        ctx.strokeStyle = palette.ink;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(pt.x, pt.y);
        ctx.lineTo(pt.x + 0.1, pt.y + 0.1);
        ctx.stroke();
        ctx.restore();
      }
    }
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing || disabled) return;
    const pt = getCoordinates(e);
    if (!pt) return;

    currentStrokeRef.current.push(pt);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = palette.ink;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const pts = currentStrokeRef.current;
    if (pts.length >= 2) {
      const p1 = pts[pts.length - 2];
      const p2 = pts[pts.length - 1];
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
    ctx.restore();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentStrokeRef.current.length > 0) {
      const updated = [...strokes, [...currentStrokeRef.current]];
      setStrokes(updated);
      currentStrokeRef.current = [];
      onChange?.(updated);
    }
  };

  const handleClear = () => {
    if (disabled) return;
    setStrokes([]);
    currentStrokeRef.current = [];
    redraw([]);
    onChange?.([]);
  };

  const hasSignature = strokes.length > 0;

  return (
    <div ref={containerRef} className={cn('flex flex-col gap-2 w-full', className)}>
      <div className="flex items-center justify-between text-sm text-muted">
        <span className="flex items-center gap-1.5 font-medium">
          <PenTool className="w-4 h-4 text-brand" />
          여기에 서명해 주세요
        </span>
        <button
          type="button"
          onClick={handleClear}
          disabled={disabled || !hasSignature}
          className="inline-flex items-center gap-1 text-xs text-muted hover:text-brand-strong disabled:opacity-40 transition-colors"
          aria-label="서명 지우기"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          다시 쓰기
        </button>
      </div>

      <div
        className={cn(
          'relative w-full rounded-xl border-2 border-dashed border-border bg-surface overflow-hidden transition-all',
          'touch-none select-none',
          hasSignature ? 'border-solid border-brand' : 'hover:border-border-strong'
        )}
        style={{ height }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="block w-full h-full cursor-crosshair"
          aria-label="서명 입력 영역"
        />

        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-muted text-sm">
            손가락이나 펜으로 서명해 주세요
          </div>
        )}

        {hasSignature && (
          <div className="absolute bottom-2 right-2 pointer-events-none flex items-center gap-1 text-xs font-semibold text-brand-strong bg-brand-soft px-2 py-0.5 rounded-full">
            <Check className="w-3.5 h-3.5" />
            입력했어요
          </div>
        )}
      </div>
    </div>
  );
}
