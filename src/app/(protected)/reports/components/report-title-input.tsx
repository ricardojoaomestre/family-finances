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
        'h-auto border-transparent bg-transparent px-0 text-2xl font-semibold shadow-none focus-visible:border-ring focus-visible:bg-input/50',
        className,
      )}
    />
  );
}
