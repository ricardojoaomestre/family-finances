import * as XLSX from '@e965/xlsx';

import { getSpreadsheetFileTypeFromName } from './detect-file-type';
import type { SpreadsheetFileType } from './types';

export type RawSpreadsheetGrid = {
  fileType: SpreadsheetFileType;
  sheetName: string;
  rows: unknown[][];
};

function toRawRows(worksheet: XLSX.WorkSheet): unknown[][] {
  return XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: null,
    raw: false,
  }) as unknown[][];
}

function hasNonEmptyCells(rows: unknown[][]): boolean {
  return rows.some((row) =>
    row.some((cell) => cell !== null && cell !== undefined && String(cell).trim() !== ''),
  );
}

export function parseSpreadsheetToRawGrid(
  data: ArrayBuffer,
  filename: string,
  fileType?: SpreadsheetFileType,
): RawSpreadsheetGrid {
  const resolvedType = fileType ?? getSpreadsheetFileTypeFromName(filename);

  if (!resolvedType) {
    throw new Error('Cannot parse file: unsupported spreadsheet type.');
  }

  const payload =
    resolvedType === 'csv'
      ? new TextDecoder().decode(data)
      : new Uint8Array(data);

  const workbook = XLSX.read(payload, {
    type: resolvedType === 'csv' ? 'string' : 'array',
    cellDates: true,
    raw: false,
  });

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) continue;

    const rows = toRawRows(worksheet);
    if (hasNonEmptyCells(rows)) {
      return { fileType: resolvedType, sheetName, rows };
    }
  }

  return {
    fileType: resolvedType,
    sheetName: workbook.SheetNames[0] ?? 'Sheet1',
    rows: [],
  };
}
