import { useReducer } from 'react';

import type { ImportSource } from '@/db/schema';
import type { ParsedImportRow } from '@/app/(protected)/dashboard/actions/import-file';
import type { ImportCategoryOption } from '@/lib/categories/get-active-categories-for-import';
import {
  createDuplicateOverrideStatus,
  validateImportRow,
  type RowValidation,
} from '@/lib/file-import';

export type ImportPreviewState = {
  parsedData: ParsedImportRow[] | null;
  rowValidations: RowValidation[] | null;
  includeBalanceColumn: boolean;
  categories: ImportCategoryOption[] | null;
  filename: string | null;
  previewLabel: string | null;
  importSource: ImportSource | null;
  periodFrom: string | null;
  periodTo: string | null;
  error: string | null;
  bankAccountId: string | undefined;
  usingGenericProfile: boolean;
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
      previewLabel?: string | null;
      importSource?: ImportSource;
      periodFrom?: string | null;
      periodTo?: string | null;
      usingGenericProfile: boolean;
    }
  | { type: 'parse-failed'; error: string }
  | { type: 'confirm-failed'; error: string }
  | { type: 'clear-preview' }
  | { type: 'reset' }
  | { type: 'set-bank-account'; bankAccountId: string }
  | {
      type: 'set-row-category';
      rowIndex: number;
      categoryId: string | null;
    }
  | { type: 'override-duplicate'; rowIndex: number }
  | { type: 'confirm-note-match'; rowIndex: number }
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
  previewLabel: null,
  importSource: null,
  periodFrom: null,
  periodTo: null,
  error: null,
  bankAccountId: undefined,
  usingGenericProfile: false,
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
        previewLabel: null,
        importSource: null,
        periodFrom: null,
        periodTo: null,
        usingGenericProfile: false,
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
        previewLabel: action.previewLabel ?? action.filename,
        importSource: action.importSource ?? 'file',
        periodFrom: action.periodFrom ?? null,
        periodTo: action.periodTo ?? null,
        usingGenericProfile: action.usingGenericProfile,
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
        previewLabel: null,
        importSource: null,
        periodFrom: null,
        periodTo: null,
        error: null,
        usingGenericProfile: false,
      };
    case 'reset':
      return initialState;
    case 'set-bank-account':
      if (state.parsedData) {
        return { ...initialState, bankAccountId: action.bankAccountId };
      }
      return { ...state, bankAccountId: action.bankAccountId };
    case 'set-row-category':
      if (!state.parsedData) {
        return state;
      }

      return {
        ...state,
        parsedData: state.parsedData.map((row, index) =>
          index === action.rowIndex
            ? {
                ...row,
                categoryId: action.categoryId,
                noteMatch: null,
              }
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
    case 'confirm-note-match':
      if (!state.parsedData) {
        return state;
      }

      return {
        ...state,
        parsedData: state.parsedData.map((row, index) =>
          index === action.rowIndex && row.noteMatch
            ? {
                ...row,
                noteMatch: {
                  ...row.noteMatch,
                  confirmed: true,
                },
              }
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
