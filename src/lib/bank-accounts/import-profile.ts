export type ImportDateFormat = 'DMY' | 'YMD' | 'auto';
export type ImportSignRule =
  | 'as-is'
  | 'debit-negative'
  | 'credit-positive'
  | 'invert';

export type BankAccountImportProfile = {
  dateColumns: string[];
  descriptionColumns: string[];
  valueColumns?: string[];
  debitColumns?: string[];
  creditColumns?: string[];
  balanceColumns?: string[];
  dateFormat: ImportDateFormat;
  signRule: ImportSignRule;
  minHeaderRow?: number;
  skipRowPatterns?: string[];
};

export const GENERIC_IMPORT_PROFILE: BankAccountImportProfile = {
  dateColumns: [
    'date',
    'data',
    'data mov.',
    'data mov',
    'data valor',
    'data movimento',
    'dt. operação',
    'dt operação',
  ],
  descriptionColumns: [
    'description',
    'descrição',
    'descricao',
    'movimento',
    'detalhe',
    'detalhes',
    'descritivo',
  ],
  valueColumns: ['value', 'valor', 'montante', 'importe', 'amount'],
  debitColumns: ['débito', 'debito', 'debit'],
  creditColumns: ['crédito', 'credito', 'credit'],
  balanceColumns: ['balance', 'saldo'],
  dateFormat: 'auto',
  signRule: 'as-is',
};
