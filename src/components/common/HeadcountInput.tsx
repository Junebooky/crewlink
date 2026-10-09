'use client';

import React from 'react';
import { Minus, Plus, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface HeadcountInputProps {
  id?: string;
  value: number;
  onChange: (newValue: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  unit?: string;
  disabled?: boolean;
  className?: string;
}

export function HeadcountInput({
  id = 'headcount-input',
  value,
  onChange,
  min = 1,
  max = 999,
  step = 1,
  label,
  unit = '명',
  disabled = false,
  className,
}: HeadcountInputProps) {
  const handleDecrement = () => {
    if (disabled || value <= min) return;
    onChange(Math.max(min, value - step));
  };

  const handleIncrement = () => {
    if (disabled || (max !== undefined && value >= max)) return;
    onChange(Math.min(max, value + step));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    if (rawVal === '') {
      onChange(min);
      return;
    }
    const parsed = parseInt(rawVal, 10);
    if (!isNaN(parsed)) {
      if (parsed < min) onChange(min);
      else if (max !== undefined && parsed > max) onChange(max);
      else onChange(parsed);
    }
  };

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={id} className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
          <Users className="w-4 h-4 text-slate-500" aria-hidden="true" />
          {label}
        </label>
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || value <= min}
          aria-label={`${label || '인원'} 1명 감소`}
          className={cn(
            'w-11 h-11 flex items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700',
            'hover:bg-slate-50 active:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#1E60F3]',
            'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white'
          )}
        >
          <Minus className="w-5 h-5" />
        </button>

        <div className="relative flex-1 max-w-[140px]">
          <input
            id={id}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={value}
            onChange={handleInputChange}
            disabled={disabled}
            className={cn(
              'w-full h-11 px-3 py-2 text-center text-lg font-bold text-slate-900 bg-white border border-slate-300 rounded-lg',
              'focus:outline-none focus:ring-2 focus:ring-[#1E60F3] focus:border-[#1E60F3] tabular-nums',
              'disabled:bg-slate-100 disabled:text-slate-400'
            )}
            aria-label={`${label || '인원'} 직접 입력`}
          />
          {unit && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400 pointer-events-none">
              {unit}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || (max !== undefined && value >= max)}
          aria-label={`${label || '인원'} 1명 증가`}
          className={cn(
            'w-11 h-11 flex items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700',
            'hover:bg-slate-50 active:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#1E60F3]',
            'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white'
          )}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
