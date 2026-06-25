import type { BankInstitution } from '@/lib/bank/types';

export function findBankInstitutionByName(
  institutions: BankInstitution[],
  nameQuery: string,
): BankInstitution | undefined {
  const normalizedQuery = nameQuery.trim().toLowerCase();

  return institutions.find((institution) =>
    institution.name.toLowerCase().includes(normalizedQuery),
  );
}
