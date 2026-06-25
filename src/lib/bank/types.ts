export type BankConnectionStatus =
  | 'pending'
  | 'linked'
  | 'expired'
  | 'failed';

export type BankInstitution = {
  id: string;
  name: string;
  countryCode: string;
  maxHistoricalDays: number;
};

export type BankConnection = {
  id: string;
  institutionId: string;
  status: BankConnectionStatus;
  accountIds: string[];
};

export type BankAccount = {
  id: string;
  iban?: string;
  name?: string;
  ownerName?: string;
  currency?: string;
  cashAccountType?: string;
  product?: string;
};

export type BankTransaction = {
  id: string;
  bookingDate: string;
  valueDate?: string;
  amount: number;
  currency: string;
  description: string;
  pending: boolean;
  balance?: number | null;
};

export type BankTransactionsFetchMode = 'recent' | 'initial';

export type BankTransactionQuery = {
  accountId: string;
  dateFrom: string;
  dateTo: string;
  fetchMode?: BankTransactionsFetchMode;
  descriptionSourceAccountIds?: string[];
  cashAccountType?: string;
  currency?: string;
  product?: string;
  psuHeaders?: import('@/lib/bank/psu-headers').PsuHeaders;
};

export type StartBankConnectionInput = {
  institutionId: string;
  redirectUrl: string;
  reference: string;
  maxHistoricalDays?: number;
  userLanguage?: string;
};

export type StartBankConnectionResult = {
  connectionId: string;
  authUrl: string;
};

export type CompleteBankConnectionInput = {
  callbackParams: Record<string, string | null>;
};

export type CompleteBankConnectionResult = {
  connection: BankConnection;
  accessValidUntil?: string | null;
};

export type FetchBankTransactionsInput = {
  connectionId: string;
  accountIds?: string[];
  dateFrom: string;
  dateTo: string;
  fetchMode?: BankTransactionsFetchMode;
  psuHeaders?: import('@/lib/bank/psu-headers').PsuHeaders;
};

export type FetchBankTransactionsResult = {
  accounts: Array<{
    account: BankAccount;
    transactions: BankTransaction[];
  }>;
};
