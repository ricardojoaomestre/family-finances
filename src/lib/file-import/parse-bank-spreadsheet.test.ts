import { describe, expect, it } from 'vitest';

import { detectImportHeader } from '@/lib/file-import/detect-import-header';
import { GENERIC_IMPORT_PROFILE } from '@/lib/file-import/merchant-profiles';
import { mapRawRowsToImportRows } from '@/lib/file-import/map-raw-rows-to-import-rows';

const englishPreambleGrid = [
  ['Bank Statement'],
  ['Account: PT50 0000 0000 0000 0000 0000 0'],
  [],
  ['Date', 'Description', 'Value', 'Balance'],
  ['05/06/2025', 'Coffee shop', '-12,50 €', '1.000,00 €'],
  ['06/06/2025', 'Salary', '2.500,00 €', '3.500,00 €'],
  ['Total', '', '', ''],
];

const portugueseHeaderGrid = [
  ['Extrato'],
  ['Data', 'Descrição', 'Valor'],
  ['05/06/2025', 'Supermercado', '45,30 €'],
  ['06/06/2025', 'Transferência', '-100,00 €'],
];

const debitCreditGrid = [
  ['Data', 'Descrição', 'Débito', 'Crédito'],
  ['05/06/2025', 'Salary', '', '2.500,00'],
  ['06/06/2025', 'Rent', '800,00', ''],
  ['Saldo', '', '', ''],
];

describe('detectImportHeader', () => {
  it('skips preamble rows and finds english headers', () => {
    const header = detectImportHeader(englishPreambleGrid, GENERIC_IMPORT_PROFILE);

    expect(header).not.toBeNull();
    expect(header?.headerRowIndex).toBe(3);
    expect(header?.mode).toBe('single-value');
    expect(header?.valueColumnIndex).toBe(2);
  });

  it('finds portuguese headers', () => {
    const header = detectImportHeader(portugueseHeaderGrid, {
      ...GENERIC_IMPORT_PROFILE,
      dateFormat: 'DMY',
    });

    expect(header).not.toBeNull();
    expect(header?.headerRowIndex).toBe(1);
    expect(header?.mode).toBe('single-value');
  });

  it('finds debit and credit columns', () => {
    const header = detectImportHeader(debitCreditGrid, GENERIC_IMPORT_PROFILE);

    expect(header).not.toBeNull();
    expect(header?.mode).toBe('debit-credit');
    expect(header?.debitColumnIndex).toBe(2);
    expect(header?.creditColumnIndex).toBe(3);
  });
});

describe('mapRawRowsToImportRows', () => {
  it('maps rows below header and skips footer rows', () => {
    const header = detectImportHeader(englishPreambleGrid, GENERIC_IMPORT_PROFILE)!;
    const rows = mapRawRowsToImportRows(englishPreambleGrid, header, {
      ...GENERIC_IMPORT_PROFILE,
      dateFormat: 'DMY',
    });

    expect(rows).toHaveLength(2);
    expect(rows[0]?.description).toBe('Coffee shop');
    expect(rows[0]?.value).toBe(-12.5);
    expect(rows[1]?.value).toBe(2500);
  });

  it('combines debit and credit columns using sign rule', () => {
    const header = detectImportHeader(debitCreditGrid, GENERIC_IMPORT_PROFILE)!;
    const rows = mapRawRowsToImportRows(debitCreditGrid, header, {
      ...GENERIC_IMPORT_PROFILE,
      dateFormat: 'DMY',
      signRule: 'debit-negative',
    });

    expect(rows).toHaveLength(2);
    expect(rows[0]?.value).toBe(2500);
    expect(rows[1]?.value).toBe(-800);
  });

  it('applies debit-negative sign rule to single value column', () => {
    const grid = [
      ['Data', 'Descrição', 'Valor'],
      ['05/06/2025', 'Supermercado', '45,30 €'],
      ['06/06/2025', 'Transferência recebida', '-100,00 €'],
    ];
    const header = detectImportHeader(grid, GENERIC_IMPORT_PROFILE)!;
    const rows = mapRawRowsToImportRows(grid, header, {
      ...GENERIC_IMPORT_PROFILE,
      dateFormat: 'DMY',
      signRule: 'debit-negative',
    });

    expect(rows[0]?.value).toBe(-45.3);
    expect(rows[1]?.value).toBe(-100);
  });
});
