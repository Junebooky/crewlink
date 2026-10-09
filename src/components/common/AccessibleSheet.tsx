'use client';

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AccessibleSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  side?: 'right' | 'center';
  className?: string;
}

export function AccessibleSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  side = 'right',
  className,
}: AccessibleSheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* Backdrop overlay with blur */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in-0" />

        <Dialog.Content
          className={cn(
            'fixed z-50 bg-white shadow-2xl focus:outline-none transition-transform duration-200',
            side === 'right'
              ? 'inset-y-0 right-0 w-full max-w-md h-full flex flex-col justify-between border-l border-slate-200 animate-in slide-in-from-right'
              : 'top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-full max-w-lg rounded-2xl p-6 border border-slate-200 animate-in zoom-in-95',
            className
          )}
          aria-describedby={description ? 'sheet-description' : undefined}
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <Dialog.Title className="text-base font-bold text-slate-900">
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description
                  id="sheet-description"
                  className="text-xs text-slate-500 mt-0.5"
                >
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
