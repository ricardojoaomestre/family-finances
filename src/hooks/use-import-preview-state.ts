import { useReducer } from 'react';

import type { ParsedImportRow } from '@/app/(protected)/dashboard/actions/import-file';
import type { ImportCategoryOption } from '@/lib/categories/get-active-categories-for-import';
import {
  createDuplicateOverrideStatus,
  validateImportRow,
  type RowValidation,
} from '@/lib/file-import';
import type { MerchantSlug } from '@/lib/merchants';

export type ImportPreviewState = {
  parsedData: ParsedImportRow[] | null;
  rowValidations: RowValidation[] | null;
  includeBalanceColumn: boolean;
  categories: ImportCategoryOption[] | null;
  filename: string | null;
  error: string | null;
  merchant: MerchantSlug | undefined;
};

function buildPreviewMeta(data: ParsedImportRow[]) {
  return {
    rowValidations: data.map((row) => validateImportRow(row)),
    includeBalanceColumn: data.some((row) => row.balance !== undefined),
  };
}

export type ImportPreviewAction =
  | { type: 'parse-started' }
  | {
      type: 'parse-succeeded';
      data: ParsedImportRow[];
      categories: ImportCategoryOption[];
      filename: string | null;
    }
  | { type: 'parse-failed'; error: string }
  | { type: 'confirm-failed'; error: string }
  | { type: 'clear-preview' }
  | { type: 'reset' }
  | { type: 'set-merchant'; merchant: MerchantSlug }
  | {
      type: 'set-row-category';
      rowIndex: number;
      categoryId: string | null;
    }
  | { type: 'override-duplicate'; rowIndex: number }
  | {
      type: 'categories-rematched';
      data: ParsedImportRow[];
      categories: ImportCategoryOption[];
    };

const initialState: ImportPreviewState = {
  parsedData: null,
  rowValidations: null,
  includeBalanceColumn: false,
  categories: null,
  filename: null,
  error: null,
  merchant: undefined,
};

function importPreviewReducer(
  state: ImportPreviewState,
  action: ImportPreviewAction,
): ImportPreviewState {
  switch (action.type) {
    case 'parse-started':
      return {
        ...state,
        error: null,
        parsedData: null,
        rowValidations: null,
        includeBalanceColumn: false,
        categories: null,
        filename: null,
      };
    case 'parse-succeeded': {
      const previewMeta = buildPreviewMeta(action.data);

      return {
        ...state,
        error: null,
        parsedData: action.data,
        rowValidations: previewMeta.rowValidations,
        includeBalanceColumn: previewMeta.includeBalanceColumn,
        categories: action.categories,
        filename: action.filename,
      };
    }
    case 'parse-failed':
    case 'confirm-failed':
      return { ...state, error: action.error };
    case 'clear-preview':
      return {
        ...state,
        parsedData: null,
        rowValidations: null,
        includeBalanceColumn: false,
        categories: null,
        filename: null,
        error: null,
      };
    case 'reset':
      return initialState;
    case 'set-merchant':
      if (state.parsedData) {
        return { ...initialState, merchant: action.merchant };
      }
      return { ...state, merchant: action.merchant };
    case 'set-row-category':
      if (!state.parsedData) {
        return state;
      }

      return {
        ...state,
        parsedData: state.parsedData.map((row, index) =>
          index === action.rowIndex
            ? { ...row, categoryId: action.categoryId }
            : row,
        ),
      };
    case 'override-duplicate':
      if (!state.parsedData) {
        return state;
      }

      return {
        ...state,
        parsedData: state.parsedData.map((row, index) =>
          index === action.rowIndex
            ? { ...row, duplicate: createDuplicateOverrideStatus() }
            : row,
        ),
      };
    case 'categories-rematched': {
      const previewMeta = buildPreviewMeta(action.data);

      return {
        ...state,
        parsedData: action.data,
        rowValidations: previewMeta.rowValidations,
        includeBalanceColumn: previewMeta.includeBalanceColumn,
        categories: action.categories,
      };
    }
  }
}

export function useImportPreviewState() {
  return useReducer(importPreviewReducer, initialState);
}
