'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { auth } from '@/auth';
import { db } from '@/db';
import { budgets, categories } from '@/db/schema';
import { isSpendingCategoryType } from '@/lib/categories/category-type';
import {
  normalizeBudgetAmount,
  validateBudgetAmount,
} from '@/lib/budgets/validate-budget';
import { getActiveHouseholdId } from '@/lib/household/active-household';
import { formatDbError } from '@/lib/db/format-db-error';

type ActionResult =
  | { ok: true }
  | {
      ok: false;
      error: string;
      fieldErrors?: Partial<Record<'categoryId' | 'amount', string>>;
    };

export type BudgetFormInput = {
  categoryId: string;
  amount: string;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

async function requireHouseholdId(): Promise<string | null> {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return getActiveHouseholdId();
}

function getFieldErrors(input: BudgetFormInput) {
  const fieldErrors: Partial<Record<'categoryId' | 'amount', string>> = {};

  if (!input.categoryId.trim() || !isUuid(input.categoryId)) {
    fieldErrors.categoryId = 'Select a category.';
  }

  const amountError = validateBudgetAmount(input.amount);

  if (amountError) {
    fieldErrors.amount = amountError;
  }

  return fieldErrors;
}

function formatUniqueBudgetError(error: unknown): ActionResult | null {
  if (!error || typeof error !== 'object') {
    return null;
  }

  const record = error as {
    code?: string;
    constraint?: string;
    cause?: unknown;
  };

  const pg =
    record.code !== undefined
      ? record
      : record.cause && typeof record.cause === 'object'
        ? (record.cause as { code?: string; constraint?: string })
        : null;

  if (pg?.code === '23505' && pg.constraint?.includes('budget')) {
    return {
      ok: false,
      error: 'This category already has a budget.',
      fieldErrors: {
        categoryId: 'This category already has a budget.',
      },
    };
  }

  return null;
}

async function validateSpendingCategory(
  householdId: string,
  categoryId: string,
  options?: { requireActive?: boolean },
): Promise<ActionResult | null> {
  const [category] = await db
    .select({ type: categories.type, active: categories.active })
    .from(categories)
    .where(
      and(eq(categories.id, categoryId), eq(categories.householdId, householdId)),
    )
    .limit(1);

  if (!category) {
    return {
      ok: false,
      error: 'Category not found.',
      fieldErrors: { categoryId: 'Category not found.' },
    };
  }

  if (options?.requireActive && !category.active) {
    return {
      ok: false,
      error: 'Select an active spending category.',
      fieldErrors: {
        categoryId: 'Select an active spending category.',
      },
    };
  }

  if (!isSpendingCategoryType(category.type)) {
    return {
      ok: false,
      error: 'Budgets can only be set for spending categories.',
      fieldErrors: {
        categoryId: 'Budgets can only be set for spending categories.',
      },
    };
  }

  return null;
}

export async function createBudget(
  input: BudgetFormInput,
): Promise<ActionResult> {
  const householdId = await requireHouseholdId();

  if (!householdId) {
    return { ok: false, error: 'You must be signed in.' };
  }

  const fieldErrors = getFieldErrors(input);

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      error: 'Fix the highlighted fields.',
      fieldErrors,
    };
  }

  const categoryError = await validateSpendingCategory(
    householdId,
    input.categoryId,
    { requireActive: true },
  );

  if (categoryError) {
    return categoryError;
  }

  try {
    await db.insert(budgets).values({
      householdId,
      categoryId: input.categoryId,
      amount: normalizeBudgetAmount(input.amount),
      updatedAt: new Date(),
    });
  } catch (error) {
    const uniqueError = formatUniqueBudgetError(error);

    if (uniqueError) {
      return uniqueError;
    }

    console.error('[createBudget]', error);

    return {
      ok: false,
      error: formatDbError(error, 'Could not create budget'),
    };
  }

  revalidatePath('/settings/budgets');
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function updateBudget(
  id: string,
  input: BudgetFormInput,
): Promise<ActionResult> {
  const householdId = await requireHouseholdId();

  if (!householdId) {
    return { ok: false, error: 'You must be signed in.' };
  }

  const fieldErrors = getFieldErrors(input);

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      error: 'Fix the highlighted fields.',
      fieldErrors,
    };
  }

  const categoryError = await validateSpendingCategory(
    householdId,
    input.categoryId,
  );

  if (categoryError) {
    return categoryError;
  }

  try {
    const [updated] = await db
      .update(budgets)
      .set({
        categoryId: input.categoryId,
        amount: normalizeBudgetAmount(input.amount),
        updatedAt: new Date(),
      })
      .where(and(eq(budgets.id, id), eq(budgets.householdId, householdId)))
      .returning({ id: budgets.id });

    if (!updated) {
      return { ok: false, error: 'Budget not found.' };
    }
  } catch (error) {
    const uniqueError = formatUniqueBudgetError(error);

    if (uniqueError) {
      return uniqueError;
    }

    console.error('[updateBudget]', error);

    return {
      ok: false,
      error: formatDbError(error, 'Could not update budget'),
    };
  }

  revalidatePath('/settings/budgets');
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function deleteBudget(id: string): Promise<ActionResult> {
  const householdId = await requireHouseholdId();

  if (!householdId) {
    return { ok: false, error: 'You must be signed in.' };
  }

  try {
    const [deleted] = await db
      .delete(budgets)
      .where(and(eq(budgets.id, id), eq(budgets.householdId, householdId)))
      .returning({ id: budgets.id });

    if (!deleted) {
      return { ok: false, error: 'Budget not found.' };
    }
  } catch (error) {
    console.error('[deleteBudget]', error);

    return {
      ok: false,
      error: formatDbError(error, 'Could not delete budget'),
    };
  }

  revalidatePath('/settings/budgets');
  revalidatePath('/dashboard');
  return { ok: true };
}
