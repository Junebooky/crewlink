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
        <label htmlFor={id} className="text-sm font-semibold text-muted flex items-center gap-1.5">
          <Users className="w-4 h-4 text-muted" aria-hidden="true" />
          {label}
        </label>
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || value <= min}
          aria-label={`${label || '인원'} ${step}명 줄이기`}
          className={cn(
            'w-11 h-11 flex items-center justify-center rounded-lg border border-border bg-surface text-muted',
            'hover:bg-canvas active:bg-surface-muted transition-colors focus:outline-none focus:ring-2 focus:ring-brand',
            'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-surface'
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
              'w-full h-11 px-3 py-2 text-center text-lg font-bold text-ink bg-surface border border-border rounded-lg',
              'focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand tabular-nums',
              'disabled:bg-surface-muted disabled:text-disabled'
            )}
            aria-label={`${label || '인원'} 직접 입력`}
          />
          {unit && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted pointer-events-none">
              {unit}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || (max !== undefined && value >= max)}
          aria-label={`${label || '인원'} ${step}명 늘리기`}
          className={cn(
            'w-11 h-11 flex items-center justify-center rounded-lg border border-border bg-surface text-muted',
            'hover:bg-canvas active:bg-surface-muted transition-colors focus:outline-none focus:ring-2 focus:ring-brand',
            'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-surface'
          )}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
