'use client';

import {
  CATEGORY_COLOR_TOKENS,
  getCategorySwatchClasses,
  type CategoryColorToken,
} from '@/lib/categories/category-colors';
import { cn } from '@/lib/utils';

type CategoryColorPickerProps = {
  value: CategoryColorToken;
  onChange: (color: CategoryColorToken) => void;
  disabled?: boolean;
};

export function CategoryColorPicker({
  value,
  onChange,
  disabled = false,
}: CategoryColorPickerProps) {
  return (
    <div
      className="grid grid-cols-6 gap-2 sm:grid-cols-10"
      role="radiogroup"
      aria-label="Category color"
    >
      {CATEGORY_COLOR_TOKENS.map((token) => {
        const selected = token === value;

        return (
          <button
            key={token}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={token}
            disabled={disabled}
            onClick={() => onChange(token)}
            className={cn(
              'size-8 cursor-pointer rounded-full border-2 transition-all',
              getCategorySwatchClasses(token),
              selected
                ? 'border-foreground ring-2 ring-ring ring-offset-2 ring-offset-background'
                : 'border-transparent hover:scale-105',
              disabled && 'pointer-events-none opacity-50',
            )}
          />
        );
      })}
    </div>
  );
}
