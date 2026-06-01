'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { auth } from '@/auth';
import { db } from '@/db';
import { importSkippedRows, imports } from '@/db/schema';
import { formatDbError } from '@/lib/db/format-db-error';
import { formatTransactionValueForKey } from '@/lib/file-import';
import { getExistingDuplicateKeys } from '@/lib/file-import/get-existing-duplicate-keys';
import {
  classifySkippedImportRow,
  serializeSkippedRowErrors,
} from '@/lib/imports/classify-skipped-import-row';
import { getImportDuplicateContext } from '@/lib/imports/get-import-duplicate-context';
import {
  parseSkippedImportRowForm,
  validateSkippedImportRowForm,
  type SkippedImportRowFormInput,
} from '@/lib/imports/validate-skipped-import-row-form';
import { isMerchantSlug } from '@/lib/merchants';

export type UpdateSkippedImportRowInput = {
  importId: string;
  skippedRowId: string;
} & SkippedImportRowFormInput;

export type UpdatedSkippedImportRow = {
  id: string;
  rowIndex: number;
  date: Date | null;
  description: string;
  value: string | null;
  balance: string | null;
  reason: import('@/db/schema').ImportSkippedRowReason;
  errors: string[] | null;
};

export type UpdateSkippedImportRowResult =
  | {
      ok: true;
      row: UpdatedSkippedImportRow;
      isValid: boolean;
    }
  | {
      ok: false;
      error: string;
      fieldErrors?: Partial<
        Record<'date' | 'description' | 'value', string>
      >;
    };

export async function updateSkippedImportRow(
  input: UpdateSkippedImportRowInput,
): Promise<UpdateSkippedImportRowResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { ok: false, error: 'You must be signed in.' };
  }

  const fieldErrors = validateSkippedImportRowForm(input);

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      error: 'Fix the highlighted fields.',
      fieldErrors,
    };
  }

  const parsed = parseSkippedImportRowForm(input);

  if (!parsed) {
    return { ok: false, error: 'Invalid row data.' };
  }

  const [importRecord] = await db
    .select({
      id: imports.id,
      merchant: imports.merchant,
    })
    .from(imports)
    .where(eq(imports.id, input.importId))
    .limit(1);

  if (!importRecord || !isMerchantSlug(importRecord.merchant)) {
    return { ok: false, error: 'Import not found.' };
  }

  const [skippedRow] = await db
    .select({
      id: importSkippedRows.id,
      rowIndex: importSkippedRows.rowIndex,
      balance: importSkippedRows.balance,
    })
    .from(importSkippedRows)
    .where(
      and(
        eq(importSkippedRows.id, input.skippedRowId),
        eq(importSkippedRows.importId, input.importId),
      ),
    )
    .limit(1);

  if (!skippedRow) {
    return { ok: false, error: 'Skipped row not found.' };
  }

  const merchant = importRecord.merchant;
  const [existingKeys, { siblingKeys }] = await Promise.all([
    getExistingDuplicateKeys(merchant),
    getImportDuplicateContext(input.importId, merchant, {
      excludeSkippedRowId: input.skippedRowId,
    }),
  ]);

  const classification = classifySkippedImportRow(
    parsed,
    merchant,
    existingKeys,
    siblingKeys,
  );

  const date = new Date(`${parsed.date!}T00:00:00.000Z`);
  const value = formatTransactionValueForKey(parsed.value!);

  try {
    await db
      .update(importSkippedRows)
      .set({
        date,
        description: parsed.description,
        value,
        reason: classification.reason,
        errors: serializeSkippedRowErrors(classification.errors),
      })
      .where(eq(importSkippedRows.id, input.skippedRowId));
  } catch (error) {
    console.error('[updateSkippedImportRow]', error);

    return {
      ok: false,
      error: formatDbError(error, 'Could not update skipped row'),
    };
  }

  revalidatePath(`/imports/${input.importId}`);

  return {
    ok: true,
    isValid: classification.isValid,
    row: {
      id: skippedRow.id,
      rowIndex: skippedRow.rowIndex,
      date,
      description: parsed.description,
      value,
      balance: skippedRow.balance,
      reason: classification.reason,
      errors: classification.errors,
    },
  };
}
