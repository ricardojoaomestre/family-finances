import {
  isCategoryColorToken,
  type CategoryColorToken,
} from '@/lib/categories/category-colors';
import { isCategoryType, type CategoryType } from '@/lib/categories/category-type';

export function resolveImportType(
  raw: string | undefined,
  columnPresent: boolean,
): CategoryType | undefined {
  if (!columnPresent) {
    return undefined;
  }

  const normalized = (raw ?? '').trim().toLowerCase();

  if (!normalized) {
    return undefined;
  }

  return isCategoryType(normalized) ? normalized : undefined;
}

export function resolveImportActive(
  raw: string | undefined,
  columnPresent: boolean,
): boolean | undefined {
  if (!columnPresent) {
    return undefined;
  }

  const normalized = (raw ?? '').trim().toLowerCase();

  if (!normalized) {
    return undefined;
  }

  if (normalized === 'true') {
    return true;
  }

  if (normalized === 'false') {
    return false;
  }

  return undefined;
}

export function resolveImportColor(
  raw: string | undefined,
  columnPresent: boolean,
): CategoryColorToken | undefined {
  if (!columnPresent) {
    return undefined;
  }

  const trimmed = (raw ?? '').trim();

  if (!trimmed) {
    return undefined;
  }

  return isCategoryColorToken(trimmed) ? trimmed : undefined;
}
