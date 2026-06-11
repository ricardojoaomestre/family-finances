'use client';

import { CategoryIcon } from '@/components/categories/category-icon';
import type { CategoryIconName } from '@/lib/categories/category-icon-names';
import { cn } from '@/lib/utils';

type CategoryPillProps = {
  name: string;
  color: string;
  icon: CategoryIconName | string;
  className?: string;
};

export function CategoryPill({ name, color, icon, className }: CategoryPillProps) {
  return (
    <span
      className={cn(
        'inline-flex max-w-[12rem] items-center gap-1.5 text-sm',
        className,
      )}
      title={name}
    >
      <CategoryIcon icon={icon} color={color} />
      <span className="truncate">{name}</span>
    </span>
  );
}
