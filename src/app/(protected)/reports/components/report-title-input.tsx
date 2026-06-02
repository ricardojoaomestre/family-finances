'use client';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type ReportTitleInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
};

export function ReportTitleInput({
  value,
  onChange,
  disabled = false,
  className,
}: ReportTitleInputProps) {
  return (
    <Input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      maxLength={80}
      aria-label="Report name"
      className={cn(
        'h-auto border-transparent bg-transparent px-0 text-3xl font-semibold leading-tight tracking-tight shadow-none transition-[font-size,padding,background-color,border-color] focus-visible:border-ring focus-visible:bg-input/50 focus-visible:px-3 focus-visible:py-2 focus-visible:text-4xl md:text-3xl md:focus-visible:text-4xl',
        className,
      )}
    />
  );
}
