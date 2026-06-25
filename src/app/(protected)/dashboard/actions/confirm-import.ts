'use server';

import { revalidatePath } from 'next/cache';

import { auth } from '@/auth';
import type { ParsedImportRow } from '@/app/(protected)/dashboard/actions/import-file';
import { getBankAccountForActiveHousehold } from '@/lib/bank-accounts/get-bank-account';
import type { ImportSource } from '@/db/schema';
import { getActiveHouseholdId } from '@/lib/household/active-household';
import { isApiImportConfirmInput } from '@/lib/imports/validate-import-period';
import { persistImportRows } from '@/lib/imports/persist-import-rows';

export type ConfirmImportInput = {
  filename?: string | null;
  bankAccountId: string;
  rows: ParsedImportRow[];
  source?: ImportSource;
  periodFrom?: string | null;
  periodTo?: string | null;
};

export type ConfirmImportResult =
  | {
      ok: true;
      importId: string;
      status: 'completed' | 'partial' | 'failed';
      importedCount: number;
      skippedCount: number;
    }
  | { ok: false; error: string };

export async function confirmImport(
  input: ConfirmImportInput,
): Promise<ConfirmImportResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { ok: false, error: 'You must be signed in to import data.' };
  }

  const householdId = await getActiveHouseholdId();

  if (!householdId) {
    return { ok: false, error: 'No active household selected.' };
  }

  const source = input.source ?? 'file';
  const filename = input.filename?.trim() || null;

  if (!isApiImportConfirmInput({ source }) && !filename) {
    return { ok: false, error: 'Filename is required.' };
  }

  if (!Array.isArray(input.rows) || input.rows.length === 0) {
    return { ok: false, error: 'No rows to import.' };
  }

  const bankAccount = await getBankAccountForActiveHousehold(input.bankAccountId);

  if (!bankAccount) {
    return { ok: false, error: 'A valid bank account is required.' };
  }

  const result = await persistImportRows({
    householdId,
    userId: session.user.id,
    bankAccountId: bankAccount.id,
    rows: input.rows,
    filename,
    source,
    periodFrom: input.periodFrom ?? null,
    periodTo: input.periodTo ?? null,
  });

  if (!result.ok) {
    return result;
  }

  revalidatePath('/imports');
  revalidatePath('/report/new');
  revalidatePath('/reports');
  revalidatePath('/notes');
  revalidatePath('/transactions');

  return result;
}
