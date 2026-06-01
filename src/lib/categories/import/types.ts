export type CategoryImportCsvRow = {
  name: string;
  regex: string;
};

export type CategoryImportPreviewRow = {
  csvName: string;
  normalizedPattern: string | null;
  action: 'create' | 'update';
};

export type CategoryImportPlanSuccess = {
  ok: true;
  rows: CategoryImportPreviewRow[];
  skippedDuplicateCount: number;
  rowsToApply: CategoryImportApplyRow[];
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
};

export type CategorySnapshotRow = {
  id: string;
  name: string;
  description: string | null;
  color: string;
  pattern: string | null;
  priority: number;
  active: boolean;
};
