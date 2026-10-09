'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { RotateCcw, Check, PenTool } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SignaturePoint = {
  x: number;
  y: number;
  time: number;
};

export type SignatureStroke = SignaturePoint[];

export interface SignatureCaptureProps {
  value?: SignatureStroke[];
  onChange?: (strokes: SignatureStroke[]) => void;
  width?: number;
  height?: number;
  className?: string;
  disabled?: boolean;
}

export function SignatureCapture({
  value = [],
  onChange,
  height = 180,
  className,
  disabled = false,
}: SignatureCaptureProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<SignatureStroke[]>(value);
  const [isDrawing, setIsDrawing] = useState(false);
  const currentStrokeRef = useRef<SignaturePoint[]>([]);

  // Redraw all strokes onto canvas with DPR scaling
  const redraw = useCallback((currentStrokes: SignatureStroke[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = '#0F172A';
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
  }, []);

  // Handle Resize and DPR changes
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${height}px`;

      redraw(strokes);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [height, redraw, strokes]);

  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent): SignaturePoint | null => {
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

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    const point = getCanvasCoords(e);
    if (!point) return;

    setIsDrawing(true);
    currentStrokeRef.current = [point];
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || disabled) return;
    const point = getCanvasCoords(e);
    if (!point) return;

    currentStrokeRef.current.push(point);
    redraw([...strokes, currentStrokeRef.current]);
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
      <div className="flex items-center justify-between text-sm text-slate-600">
        <span className="flex items-center gap-1.5 font-medium">
          <PenTool className="w-4 h-4 text-[#1E60F3]" />
          자필 서명 (벡터 스트로크 보존)
        </span>
        <button
          type="button"
          onClick={handleClear}
          disabled={disabled || !hasSignature}
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-red-600 disabled:opacity-40 transition-colors"
          aria-label="서명 초기화"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          다시 쓰기
        </button>
      </div>

      <div
        className={cn(
          'relative w-full rounded-xl border-2 border-dashed border-slate-300 bg-white overflow-hidden transition-all',
          'touch-none select-none',
          hasSignature ? 'border-solid border-[#1E60F3]' : 'hover:border-slate-400'
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
          aria-label="전자서명 캔버스"
        />

        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-sm">
            여기에 서명해 주세요
          </div>
        )}

        {hasSignature && (
          <div className="absolute bottom-2 right-2 pointer-events-none flex items-center gap-1 text-xs font-semibold text-[#08734E] bg-[#E7F5EE] px-2 py-0.5 rounded-full">
            <Check className="w-3.5 h-3.5" />
            서명 기록됨 ({strokes.length} 획)
          </div>
        )}
      </div>
    </div>
  );
}
