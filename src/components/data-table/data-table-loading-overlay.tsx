'use client';

import { Loader2Icon } from 'lucide-react';

import { cn } from '@/lib/utils';

type DataTableLoadingOverlayProps = {
  isLoading: boolean;
  children: React.ReactNode;
  className?: string;
};

export function DataTableLoadingOverlay({
  isLoading,
  children,
  className,
}: DataTableLoadingOverlayProps) {
  return (
    <div className={cn('relative', className)}>
      {children}
      {isLoading ? (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center rounded-[inherit] bg-background/60 backdrop-blur-[2px]"
          aria-busy="true"
          aria-live="polite"
        >
          <Loader2Icon
            className="size-6 animate-spin text-muted-foreground"
            aria-hidden
          />
          <span className="sr-only">Loading table…</span>
        </div>
      ) : null}
    </div>
  );
}
