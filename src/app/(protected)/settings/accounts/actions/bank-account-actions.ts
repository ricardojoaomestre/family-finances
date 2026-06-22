'use server';

import { and, count, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { auth } from '@/auth';
import { db } from '@/db';
import {
  bankAccounts,
  households,
  imports,
  notes,
  transactions,
} from '@/db/schema';
import type { BankAccountImportProfile } from '@/lib/bank-accounts/import-profile';
import {
  normalizeBankAccountLabel,
  normalizeBankAccountSlug,
  parseBankAccountImportProfileForm,
  validateBankAccountImportProfileForm,
  validateBankAccountLabel,
  validateBankAccountSlug,
  type BankAccountImportProfileFormInput,
} from '@/lib/bank-accounts/validate-bank-account';
import { getActiveHouseholdId } from '@/lib/household/active-household';
import { formatDbError } from '@/lib/db/format-db-error';

type ActionResult =
  | { ok: true }
  | {
      ok: false;
      error: string;
      fieldErrors?: BankAccountFieldErrors;
    };

export type BankAccountFormInput = {
  slug: string;
  label: string;
  importProfile: BankAccountImportProfileFormInput;
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

type BankAccountFieldErrors = Partial<
  Record<'slug' | 'label' | keyof BankAccountImportProfileFormInput, string>
>;

function getFieldErrors(input: BankAccountFormInput): BankAccountFieldErrors {
  const fieldErrors: BankAccountFieldErrors = {};

  const slugError = validateBankAccountSlug(input.slug);

  if (slugError) {
    fieldErrors.slug = slugError;
  }

  const labelError = validateBankAccountLabel(input.label);

  if (labelError) {
    fieldErrors.label = labelError;
  }

  Object.assign(fieldErrors, validateBankAccountImportProfileForm(input.importProfile));

  return fieldErrors;
}

function formatUniqueSlugError(error: unknown): ActionResult | null {
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

  if (pg?.code === '23505' && pg.constraint?.includes('bank_account')) {
    return {
      ok: false,
      error: 'An account with this slug already exists.',
      fieldErrors: {
        slug: 'An account with this slug already exists.',
      },
    };
  }

  return null;
}

function parseValidatedInput(input: BankAccountFormInput): {
  slug: string;
  label: string;
  importProfile: BankAccountImportProfile;
} | null {
  const fieldErrors = getFieldErrors(input);

  if (Object.keys(fieldErrors).length > 0) {
    return null;
  }

  const importProfile = parseBankAccountImportProfileForm(input.importProfile);

  if (!importProfile) {
    return null;
  }

  return {
    slug: normalizeBankAccountSlug(input.slug),
    label: normalizeBankAccountLabel(input.label),
    importProfile,
  };
}

async function accountIsInUse(
  householdId: string,
  bankAccountId: string,
): Promise<string | null> {
  const [[transactionCount], [importCount], [noteCount], [primaryHousehold]] =
    await Promise.all([
      db
        .select({ count: count() })
        .from(transactions)
        .where(
          and(
            eq(transactions.householdId, householdId),
            eq(transactions.bankAccountId, bankAccountId),
          ),
        ),
      db
        .select({ count: count() })
        .from(imports)
        .where(
          and(
            eq(imports.householdId, householdId),
            eq(imports.bankAccountId, bankAccountId),
          ),
        ),
      db
        .select({ count: count() })
        .from(notes)
        .where(
          and(
            eq(notes.householdId, householdId),
            eq(notes.bankAccountId, bankAccountId),
          ),
        ),
      db
        .select({ id: households.id })
        .from(households)
        .where(
          and(
            eq(households.id, householdId),
            eq(households.primaryBankAccountId, bankAccountId),
          ),
        )
        .limit(1),
    ]);

  if ((transactionCount?.count ?? 0) > 0) {
    return 'This account has transactions and cannot be deleted.';
  }

  if ((importCount?.count ?? 0) > 0) {
    return 'This account has import jobs and cannot be deleted.';
  }

  if ((noteCount?.count ?? 0) > 0) {
    return 'This account has notes and cannot be deleted.';
  }

  if (primaryHousehold) {
    return 'Unset this account as the household primary account before deleting it.';
  }

  return null;
}

export async function createBankAccount(
  input: BankAccountFormInput,
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

  const parsed = parseValidatedInput(input);

  if (!parsed) {
    return { ok: false, error: 'Invalid account details.' };
  }

  try {
    await db.insert(bankAccounts).values({
      householdId,
      slug: parsed.slug,
      label: parsed.label,
      importProfile: parsed.importProfile,
      updatedAt: new Date(),
    });
  } catch (error) {
    const uniqueError = formatUniqueSlugError(error);

    if (uniqueError) {
      return uniqueError;
    }

    console.error('[createBankAccount]', error);

    return {
      ok: false,
      error: formatDbError(error, 'Could not create account'),
    };
  }

  revalidatePath('/settings/accounts');
  revalidatePath('/imports/new');
  revalidatePath('/transactions');
  revalidatePath('/notes');
  revalidatePath('/settings/household');
  return { ok: true };
}

export async function updateBankAccount(
  id: string,
  input: BankAccountFormInput,
): Promise<ActionResult> {
  const householdId = await requireHouseholdId();

  if (!householdId) {
    return { ok: false, error: 'You must be signed in.' };
  }

  if (!isUuid(id)) {
    return { ok: false, error: 'Account not found.' };
  }

  const fieldErrors = getFieldErrors(input);

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      error: 'Fix the highlighted fields.',
      fieldErrors,
    };
  }

  const parsed = parseValidatedInput(input);

  if (!parsed) {
    return { ok: false, error: 'Invalid account details.' };
  }

  try {
    const [updated] = await db
      .update(bankAccounts)
      .set({
        slug: parsed.slug,
        label: parsed.label,
        importProfile: parsed.importProfile,
        updatedAt: new Date(),
      })
      .where(and(eq(bankAccounts.id, id), eq(bankAccounts.householdId, householdId)))
      .returning({ id: bankAccounts.id });

    if (!updated) {
      return { ok: false, error: 'Account not found.' };
    }
  } catch (error) {
    const uniqueError = formatUniqueSlugError(error);

    if (uniqueError) {
      return uniqueError;
    }

    console.error('[updateBankAccount]', error);

    return {
      ok: false,
      error: formatDbError(error, 'Could not update account'),
    };
  }

  revalidatePath('/settings/accounts');
  revalidatePath('/imports/new');
  revalidatePath('/transactions');
  revalidatePath('/notes');
  revalidatePath('/settings/household');
  return { ok: true };
}

export async function deleteBankAccount(id: string): Promise<ActionResult> {
  const householdId = await requireHouseholdId();

  if (!householdId) {
    return { ok: false, error: 'You must be signed in.' };
  }

  if (!isUuid(id)) {
    return { ok: false, error: 'Account not found.' };
  }

  const inUseError = await accountIsInUse(householdId, id);

  if (inUseError) {
    return { ok: false, error: inUseError };
  }

  try {
    const [deleted] = await db
      .delete(bankAccounts)
      .where(and(eq(bankAccounts.id, id), eq(bankAccounts.householdId, householdId)))
      .returning({ id: bankAccounts.id });

    if (!deleted) {
      return { ok: false, error: 'Account not found.' };
    }
  } catch (error) {
    console.error('[deleteBankAccount]', error);

    return {
      ok: false,
      error: formatDbError(error, 'Could not delete account'),
    };
  }

  revalidatePath('/settings/accounts');
  revalidatePath('/imports/new');
  revalidatePath('/transactions');
  revalidatePath('/notes');
  revalidatePath('/settings/household');
  return { ok: true };
}
