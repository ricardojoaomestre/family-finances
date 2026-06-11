'use server';

import { eq, inArray, max, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { auth } from '@/auth';
import { db } from '@/db';
import { categories } from '@/db/schema';
import type { CategoryColorToken } from '@/lib/categories/category-colors';
import type { CategoryIconName } from '@/lib/categories/category-icons';
import type { CategoryType } from '@/lib/categories/category-type';
import {
  validateCategoryColor,
  validateCategoryDescription,
  validateCategoryIcon,
  validateCategoryName,
  validateCategoryPattern,
  validateCategoryType,
} from '@/lib/categories/validate-category';
import { formatDbError } from '@/lib/db/format-db-error';

type ActionResult =
  | { ok: true }
  | {
      ok: false;
      error: string;
      fieldErrors?: Partial<
        Record<
          'name' | 'pattern' | 'description' | 'color' | 'icon' | 'type',
          string
        >
      >;
    };

export type CategoryFormInput = {
  id?: string;
  name: string;
  description: string;
  color: CategoryColorToken;
  icon: CategoryIconName;
  pattern: string;
  active: boolean;
  type: CategoryType;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

function getFieldErrors(
  input: CategoryFormInput,
  options?: { existingName?: string | null },
) {
  const fieldErrors: Partial<
    Record<'name' | 'pattern' | 'description' | 'color' | 'icon' | 'type', string>
  > = {};
  const nameError = validateCategoryName(input.name, {
    existingName: options?.existingName,
  });
  const descriptionError = validateCategoryDescription(input.description);
  const patternError = validateCategoryPattern(input.pattern);
  const colorError = validateCategoryColor(input.color);
  const iconError = validateCategoryIcon(input.icon);
  const typeError = validateCategoryType(input.type);

  if (nameError) {
    fieldErrors.name = nameError;
  }

  if (descriptionError) {
    fieldErrors.description = descriptionError;
  }

  if (patternError) {
    fieldErrors.pattern = patternError;
  }

  if (colorError) {
    fieldErrors.color = colorError;
  }

  if (iconError) {
    fieldErrors.icon = iconError;
  }

  if (typeError) {
    fieldErrors.type = typeError;
  }

  return fieldErrors;
}

async function requireSessionUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

async function getNextPriority(): Promise<number> {
  const [result] = await db
    .select({ value: max(categories.priority) })
    .from(categories);

  return (result?.value ?? 0) + 1;
}

function getPostgresError(error: unknown): { code?: string; constraint?: string } | null {
  if (!error || typeof error !== 'object') {
    return null;
  }

  const record = error as { code?: string; constraint?: string; cause?: unknown };

  if (record.code) {
    return record;
  }

  if (record.cause && typeof record.cause === 'object') {
    return getPostgresError(record.cause);
  }

  return null;
}

function formatUniqueNameError(error: unknown): ActionResult | null {
  const pg = getPostgresError(error);

  if (pg?.code === '23505' && pg.constraint?.includes('name')) {
    return {
      ok: false,
      error: 'A category with this name already exists.',
      fieldErrors: { name: 'A category with this name already exists.' },
    };
  }

  return null;
}

export async function createCategory(
  input: CategoryFormInput,
): Promise<ActionResult> {
  const userId = await requireSessionUserId();

  if (!userId) {
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

  const id =
    input.id && isUuid(input.id) ? input.id : crypto.randomUUID();
  const description = input.description.trim() || null;

  try {
    await db.insert(categories).values({
      id,
      name: input.name.trim(),
      description,
      color: input.color,
      icon: input.icon,
      pattern: input.pattern.trim() || null,
      active: input.active,
      type: input.type,
      priority: await getNextPriority(),
      updatedAt: new Date(),
    });
  } catch (error) {
    const uniqueError = formatUniqueNameError(error);

    if (uniqueError) {
      return uniqueError;
    }

    console.error('[createCategory]', error);

    return {
      ok: false,
      error: formatDbError(error, 'Could not create category'),
    };
  }

  revalidatePath('/settings/categories');
  return { ok: true };
}

export async function updateCategory(
  id: string,
  input: CategoryFormInput,
): Promise<ActionResult> {
  const userId = await requireSessionUserId();

  if (!userId) {
    return { ok: false, error: 'You must be signed in.' };
  }

  const [existing] = await db
    .select({ name: categories.name })
    .from(categories)
    .where(eq(categories.id, id));

  if (!existing) {
    return { ok: false, error: 'Category not found.' };
  }

  const fieldErrors = getFieldErrors(input, { existingName: existing.name });

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      error: 'Fix the highlighted fields.',
      fieldErrors,
    };
  }

  const description = input.description.trim() || null;

  try {
    const [updated] = await db
      .update(categories)
      .set({
        name: input.name.trim(),
        description,
        color: input.color,
        icon: input.icon,
        pattern: input.pattern.trim() || null,
        active: input.active,
        type: input.type,
        updatedAt: new Date(),
      })
      .where(eq(categories.id, id))
      .returning({ id: categories.id });

    if (!updated) {
      return { ok: false, error: 'Category not found.' };
    }
  } catch (error) {
    const uniqueError = formatUniqueNameError(error);

    if (uniqueError) {
      return uniqueError;
    }

    console.error('[updateCategory]', error);

    return {
      ok: false,
      error: formatDbError(error, 'Could not update category'),
    };
  }

  revalidatePath('/settings/categories');
  revalidatePath('/transactions');
  revalidatePath('/imports');
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function setCategoryActive(
  id: string,
  active: boolean,
): Promise<ActionResult> {
  const userId = await requireSessionUserId();

  if (!userId) {
    return { ok: false, error: 'You must be signed in.' };
  }

  try {
    const [updated] = await db
      .update(categories)
      .set({ active, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning({ id: categories.id });

    if (!updated) {
      return { ok: false, error: 'Category not found.' };
    }
  } catch (error) {
    console.error('[setCategoryActive]', error);

    return {
      ok: false,
      error: formatDbError(error, 'Could not update category status'),
    };
  }

  revalidatePath('/settings/categories');
  return { ok: true };
}

export async function reorderCategories(
  orderedIds: string[],
): Promise<ActionResult> {
  const userId = await requireSessionUserId();

  if (!userId) {
    return { ok: false, error: 'You must be signed in.' };
  }

  if (orderedIds.length === 0) {
    return { ok: true };
  }

  const uniqueIds = new Set(orderedIds);

  if (uniqueIds.size !== orderedIds.length) {
    return { ok: false, error: 'Invalid category order.' };
  }

  try {
    const existing = await db
      .select({ id: categories.id })
      .from(categories);

    if (existing.length !== orderedIds.length) {
      return {
        ok: false,
        error: 'Category list is out of date. Refresh and try again.',
      };
    }

    const existingIds = new Set(existing.map((row) => row.id));

    if (!orderedIds.every((id) => existingIds.has(id))) {
      return { ok: false, error: 'Invalid category order.' };
    }

    const now = new Date();
    const whenClauses = orderedIds.map((id, index) =>
      sql`when ${id} then ${index + 1}`,
    );

    await db
      .update(categories)
      .set({
        priority: sql`(case ${categories.id} ${sql.join(whenClauses, sql` `)} end)::integer`,
        updatedAt: now,
      })
      .where(inArray(categories.id, orderedIds));
  } catch (error) {
    console.error('[reorderCategories]', error);

    return {
      ok: false,
      error: formatDbError(error, 'Could not update category order'),
    };
  }

  revalidatePath('/settings/categories');
  return { ok: true };
}
