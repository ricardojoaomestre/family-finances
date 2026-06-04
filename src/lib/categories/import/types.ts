import type { CategoryColorToken } from '@/lib/categories/category-colors';
import type { CategoryType } from '@/lib/categories/category-type';

export type CategoryImportCsvRow = {
  name: string;
  regex: string;
  type?: string;
  active?: string;
  color?: string;
};

export type CategoryCsvOptionalColumns = {
  type: boolean;
  active: boolean;
  color: boolean;
};

export type ParsedCategoryCsv = {
  rows: CategoryImportCsvRow[];
  columns: CategoryCsvOptionalColumns;
};

export type CategoryImportPreviewRow = {
  csvName: string;
  normalizedPattern: string | null;
  action: 'create' | 'update';
  csvType?: string;
  csvActive?: string;
  csvColor?: string;
};

export type CategoryImportPlanSuccess = {
  ok: true;
  rows: CategoryImportPreviewRow[];
  skippedDuplicateCount: number;
  rowsToApply: CategoryImportApplyRow[];
  columns: CategoryCsvOptionalColumns;
};

export type CategoryImportPlanFailure = {
  ok: false;
  error: string;
};

export type CategoryImportPlanResult =
  | CategoryImportPlanSuccess
  | CategoryImportPlanFailure;

export type CategoryImportApplyRow = {
  csvName: string;
  normalizedPattern: string | null;
  action: 'create' | 'update';
  targetCategoryId?: string;
  wasInactive?: boolean;
  type?: CategoryType;
  active?: boolean;
  color?: CategoryColorToken;
};

export type CategorySnapshotRow = {
  id: string;
  name: string;
  description: string | null;
  color: string;
  pattern: string | null;
  priority: number;
  active: boolean;
  type: CategoryType;
};
