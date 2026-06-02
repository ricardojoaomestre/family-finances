'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { auth } from '@/auth';
import { db } from '@/db';
import { reports } from '@/db/schema';
import { validateReportName } from '@/lib/reports/validate-report-name';
import { validateReportDateRange } from '@/lib/reports/validate-report-date-range';
import { formatDbError } from '@/lib/db/format-db-error';

type ActionSuccess = { ok: true; id: string };
type ActionFailure = { ok: false; error: string };
type DeleteSuccess = { ok: true };
type DeleteFailure = { ok: false; error: string };

export type SaveReportInput = {
  name: string;
  dateFrom: string;
  dateTo: string;
};

async function requireSessionUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

function validateSaveInput(input: SaveReportInput): ActionFailure | null {
  const nameError = validateReportName(input.name);

  if (nameError) {
    return { ok: false, error: nameError };
  }

  const dateValidation = validateReportDateRange(input.dateFrom, input.dateTo);

  if (!dateValidation.ok) {
    return { ok: false, error: dateValidation.message };
  }

  return null;
}

export async function createReport(
  input: SaveReportInput,
): Promise<ActionSuccess | ActionFailure> {
  const userId = await requireSessionUserId();

  if (!userId) {
    return { ok: false, error: 'You must be signed in.' };
  }

  const validationError = validateSaveInput(input);

  if (validationError) {
    return validationError;
  }

  const dateValidation = validateReportDateRange(input.dateFrom, input.dateTo);

  if (!dateValidation.ok) {
    return { ok: false, error: dateValidation.message };
  }

  const now = new Date();

  try {
    const [created] = await db
      .insert(reports)
      .values({
        name: input.name.trim(),
        dateFrom: dateValidation.dateFrom,
        dateTo: dateValidation.dateTo,
        updatedAt: now,
      })
      .returning({ id: reports.id });

    if (!created) {
      return { ok: false, error: 'Could not create report.' };
    }

    revalidatePath('/reports');

    return { ok: true, id: created.id };
  } catch (error) {
    console.error('[createReport]', error);

    return {
      ok: false,
      error: formatDbError(error, 'Could not create report'),
    };
  }
}

export async function updateReport(
  id: string,
  input: SaveReportInput,
): Promise<ActionSuccess | ActionFailure> {
  const userId = await requireSessionUserId();

  if (!userId) {
    return { ok: false, error: 'You must be signed in.' };
  }

  const validationError = validateSaveInput(input);

  if (validationError) {
    return validationError;
  }

  const dateValidation = validateReportDateRange(input.dateFrom, input.dateTo);

  if (!dateValidation.ok) {
    return { ok: false, error: dateValidation.message };
  }

  const now = new Date();

  try {
    const [updated] = await db
      .update(reports)
      .set({
        name: input.name.trim(),
        dateFrom: dateValidation.dateFrom,
        dateTo: dateValidation.dateTo,
        updatedAt: now,
      })
      .where(eq(reports.id, id))
      .returning({ id: reports.id });

    if (!updated) {
      return { ok: false, error: 'Report not found.' };
    }

    revalidatePath('/reports');
    revalidatePath(`/reports/${id}`);

    return { ok: true, id: updated.id };
  } catch (error) {
    console.error('[updateReport]', error);

    return {
      ok: false,
      error: formatDbError(error, 'Could not update report'),
    };
  }
}

export async function deleteReport(
  id: string,
): Promise<DeleteSuccess | DeleteFailure> {
  const userId = await requireSessionUserId();

  if (!userId) {
    return { ok: false, error: 'You must be signed in.' };
  }

  try {
    const [deleted] = await db
      .delete(reports)
      .where(eq(reports.id, id))
      .returning({ id: reports.id });

    if (!deleted) {
      return { ok: false, error: 'Report not found.' };
    }

    revalidatePath('/reports');

    return { ok: true };
  } catch (error) {
    console.error('[deleteReport]', error);

    return {
      ok: false,
      error: formatDbError(error, 'Could not delete report'),
    };
  }
}
