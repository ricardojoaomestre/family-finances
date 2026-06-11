'use client';

import { useState, type ReactNode } from 'react';
import { ChevronDownIcon, ListFilterIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

type TableFiltersCollapsibleProps = {
  hasActiveFilters?: boolean;
  children: ReactNode;
};

/**
 * Collapses filters behind a "Filters" toggle on mobile so data stays above
 * the fold, while keeping them always visible on md+ screens.
 */
export function TableFiltersCollapsible({
  hasActiveFilters = false,
  children,
}: TableFiltersCollapsibleProps) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-between md:hidden"
        >
          <span className="flex items-center gap-2">
            <ListFilterIcon />
            Filters
            {hasActiveFilters ? (
              <span
                aria-label="Filters active"
                className="size-2 rounded-full bg-primary"
              />
            ) : null}
          </span>
          <ChevronDownIcon
            className={cn('transition-transform', open && 'rotate-180')}
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent
        forceMount
        className={cn('mt-3 md:mt-0', !open && 'max-md:hidden')}
      >
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
