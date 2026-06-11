'use client';

import { createElement } from 'react';

import { getCategoryIconComponent } from '@/lib/categories/category-icon-components';
import {
  resolveCategoryIcon,
  type CategoryIconName,
} from '@/lib/categories/category-icon-names';
import {
  getCategoryPillClasses,
  isCategoryColorToken,
  type CategoryColorToken,
} from '@/lib/categories/category-colors';
import { cn } from '@/lib/utils';

type CategoryIconProps = {
  icon: CategoryIconName | string;
  color: string;
  className?: string;
  size?: 'sm' | 'md';
};

export function CategoryIcon({
  icon,
  color,
  className,
  size = 'sm',
}: CategoryIconProps) {
  const token: CategoryColorToken = isCategoryColorToken(color)
    ? color
    : 'sky-200';
  const resolvedIcon = resolveCategoryIcon(icon);

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-md',
        size === 'sm' ? 'size-6' : 'size-7',
        getCategoryPillClasses(token),
        className,
      )}
      aria-hidden
      data-icon={resolvedIcon}
    >
      {createElement(getCategoryIconComponent(icon), {
        className: size === 'sm' ? 'size-3.5' : 'size-4',
        strokeWidth: 2,
      })}
    </span>
  );
}
