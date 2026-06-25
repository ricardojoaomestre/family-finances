import type {
  BankAccount,
  BankConnection,
  BankInstitution,
  BankTransaction,
  BankTransactionQuery,
  CompleteBankConnectionInput,
  CompleteBankConnectionResult,
  StartBankConnectionInput,
  StartBankConnectionResult,
} from '@/lib/bank/types';

export type BankAggregatorProvider = {
  readonly id: string;
  readonly displayName: string;

  listInstitutions(countryCode: string): Promise<BankInstitution[]>;

  startConnection(
    input: StartBankConnectionInput,
  ): Promise<StartBankConnectionResult>;

  completeConnection(
    input: CompleteBankConnectionInput,
  ): Promise<CompleteBankConnectionResult>;

  getConnection(connectionId: string): Promise<BankConnection>;

  getAccount(accountId: string): Promise<BankAccount>;

  getTransactions(query: BankTransactionQuery): Promise<BankTransaction[]>;
};

export type BankAggregatorProviderFactory = () => BankAggregatorProvider;
