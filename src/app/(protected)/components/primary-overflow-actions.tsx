'use client';

import { MoreHorizontalIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export type OverflowAction = {
  label: string;
  onSelect: () => void;
  disabled?: boolean;
};

type PrimaryOverflowActionsProps = {
  primaryLabel: string;
  onPrimaryClick: () => void;
  primaryDisabled?: boolean;
  overflowActions: OverflowAction[];
  className?: string;
};

export function PrimaryOverflowActions({
  primaryLabel,
  onPrimaryClick,
  primaryDisabled,
  overflowActions,
  className,
}: PrimaryOverflowActionsProps) {
  if (overflowActions.length === 0) {
    return (
      <Button
        type="button"
        onClick={onPrimaryClick}
        disabled={primaryDisabled}
      >
        {primaryLabel}
      </Button>
    );
  }

  return (
    <div className={cn('inline-flex', className)} role="group">
      <Button
        type="button"
        onClick={onPrimaryClick}
        disabled={primaryDisabled}
        className="rounded-r-none"
      >
        {primaryLabel}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            size="icon"
            disabled={primaryDisabled}
            className="rounded-l-none border-l-0"
            aria-label="More actions"
          >
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {overflowActions.map((action) => (
            <DropdownMenuItem
              key={action.label}
              disabled={action.disabled}
              onSelect={action.onSelect}
            >
              {action.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
