'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { auth } from '@/auth';
import { db } from '@/db';
import { categories, transactions } from '@/db/schema';
import {
  getDefaultCategoryColor,
  isCategoryColorToken,
  type CategoryColorToken,
} from '@/lib/categories/category-colors';
import {
  resolveCategoryIcon,
  type CategoryIconName,
} from '@/lib/categories/category-icons';
import { resolveCategoryType } from '@/lib/categories/category-type';
import { getActiveHouseholdId } from '@/lib/household/active-household';
import { formatDbError } from '@/lib/db/format-db-error';
import {
  CATEGORY_TYPE_MISMATCH_MESSAGE,
  isCategoryTypeAllowedForTransactionValue,
} from '@/lib/transactions/category-types-for-value';
import { isTransactionId } from '@/lib/transactions/validate-transaction-form';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export type UpdatedTransactionCategory = {
  id: string;
  name: string;
  color: CategoryColorToken;
  icon: CategoryIconName;
};

type UpdateTransactionCategoryResult =
  | { ok: true; category: UpdatedTransactionCategory }
  | {
      ok: false;
      error: string;
      fieldErrors?: Partial<Record<'categoryId', string>>;
    };

export async function updateTransactionCategory(input: {
  transactionId: string;
  categoryId: string;
  allowCategoryTypeMismatch?: boolean;
}): Promise<UpdateTransactionCategoryResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { ok: false, error: 'You must be signed in.' };
  }

  const householdId = await getActiveHouseholdId();

  if (!householdId) {
    return { ok: false, error: 'No active household selected.' };
  }

  if (!isTransactionId(input.transactionId)) {
    return { ok: false, error: 'Transaction not found.' };
  }

  if (!isUuid(input.categoryId)) {
    return {
      ok: false,
      error: 'Fix the highlighted fields.',
      fieldErrors: { categoryId: 'Select a category.' },
    };
  }

  const [existing] = await db
    .select({
      id: transactions.id,
      value: transactions.value,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.id, input.transactionId),
        eq(transactions.householdId, householdId),
      ),
    );

  if (!existing) {
    return { ok: false, error: 'Transaction not found.' };
  }

  const [category] = await db
    .select({
      id: categories.id,
      name: categories.name,
      color: categories.color,
      icon: categories.icon,
      type: categories.type,
      active: categories.active,
    })
    .from(categories)
    .where(
      and(
        eq(categories.id, input.categoryId),
        eq(categories.householdId, householdId),
      ),
    );

  if (!category) {
    return {
      ok: false,
      error: 'Fix the highlighted fields.',
      fieldErrors: { categoryId: 'Category not found.' },
    };
  }

  if (!category.active) {
    return {
      ok: false,
      error: 'Fix the highlighted fields.',
      fieldErrors: { categoryId: 'Select an active category.' },
    };
  }

  const categoryType = resolveCategoryType(category.type);

  if (
    !input.allowCategoryTypeMismatch &&
    !isCategoryTypeAllowedForTransactionValue(existing.value, categoryType)
  ) {
    return {
      ok: false,
      error: 'Fix the highlighted fields.',
      fieldErrors: {
        categoryId: CATEGORY_TYPE_MISMATCH_MESSAGE,
      },
    };
  }

  try {
    const [updated] = await db
      .update(transactions)
      .set({ categoryId: input.categoryId })
      .where(
        and(
          eq(transactions.id, input.transactionId),
          eq(transactions.householdId, householdId),
        ),
      )
      .returning({ id: transactions.id });

    if (!updated) {
      return { ok: false, error: 'Transaction not found.' };
    }
  } catch (error) {
    console.error('[updateTransactionCategory]', error);

    return {
      ok: false,
      error: formatDbError(error, 'Could not update category'),
    };
  }

  revalidatePath('/transactions');
  revalidatePath('/imports');
  revalidatePath('/dashboard');
  revalidatePath('/report/new');
  revalidatePath('/reports');

  return {
    ok: true,
    category: {
      id: category.id,
      name: category.name,
      color: isCategoryColorToken(category.color)
        ? category.color
        : getDefaultCategoryColor(category.id),
      icon: resolveCategoryIcon(category.icon),
    },
  };
}
