'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { auth } from '@/auth';
import { db } from '@/db';
import { categories, transactions } from '@/db/schema';
import { formatTransactionValueForKey } from '@/lib/file-import/duplicate-key';
import { formatDbError } from '@/lib/db/format-db-error';
import {
  isTransactionId,
  parseValidatedTransactionForm,
  validateTransactionForm,
  type TransactionFormInput,
} from '@/lib/transactions/validate-transaction-form';

type UpdateTransactionResult =
  | { ok: true }
  | {
      ok: false;
      error: string;
      fieldErrors?: Partial<
        Record<'date' | 'description' | 'value' | 'categoryId' | 'merchant', string>
      >;
    };

export async function updateTransaction(
  input: TransactionFormInput,
): Promise<UpdateTransactionResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { ok: false, error: 'You must be signed in.' };
  }

  if (!isTransactionId(input.id)) {
    return { ok: false, error: 'Transaction not found.' };
  }

  const fieldErrors = validateTransactionForm(input);

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      error: 'Fix the highlighted fields.',
      fieldErrors,
    };
  }

  const parsed = parseValidatedTransactionForm(input);

  if (!parsed) {
    return { ok: false, error: 'Invalid transaction data.' };
  }

  const [existing] = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(eq(transactions.id, input.id));

  if (!existing) {
    return { ok: false, error: 'Transaction not found.' };
  }

  if (parsed.categoryId !== null) {
    const [category] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.id, parsed.categoryId));

    if (!category) {
      return {
        ok: false,
        error: 'Fix the highlighted fields.',
        fieldErrors: { categoryId: 'Category not found.' },
      };
    }
  }

  try {
    const [updated] = await db
      .update(transactions)
      .set({
        date: parsed.date,
        description: parsed.description,
        value: formatTransactionValueForKey(parsed.value),
        categoryId: parsed.categoryId,
        merchant: parsed.merchant,
      })
      .where(eq(transactions.id, input.id))
      .returning({ id: transactions.id });

    if (!updated) {
      return { ok: false, error: 'Transaction not found.' };
    }
  } catch (error) {
    console.error('[updateTransaction]', error);

    return {
      ok: false,
      error: formatDbError(error, 'Could not update transaction'),
    };
  }

  revalidatePath('/transactions');
  revalidatePath('/imports');
  revalidatePath('/dashboard');
  revalidatePath('/report/new');

  return { ok: true };
}
