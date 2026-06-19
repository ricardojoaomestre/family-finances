import { and, asc, eq, isNotNull, isNull } from 'drizzle-orm';

import { db } from '@/db';
import { categories, notes } from '@/db/schema';
import { requireActiveHouseholdId } from '@/lib/household/active-household';
import {
  getDefaultCategoryColor,
  isCategoryColorToken,
} from '@/lib/categories/category-colors';
import {
  resolveCategoryIcon,
} from '@/lib/categories/category-icons';
import {
  resolveCategoryType,
  type CategoryType,
} from '@/lib/categories/category-type';
import { isNoteEligibleCategoryType } from './normalize-note-value';
import type { NoteCategoryOption, NoteRow } from './types';

export type { NoteCategoryOption };

function mapNoteRow(row: {
  id: string;
  merchant: string;
  date: Date;
  value: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  categoryActive: boolean;
  categoryType: CategoryType;
  context: string | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): NoteRow | null {
  const categoryType = resolveCategoryType(row.categoryType);

  if (!isNoteEligibleCategoryType(categoryType)) {
    return null;
  }

  return {
    id: row.id,
    merchant: row.merchant,
    date: row.date,
    value: row.value,
    categoryId: row.categoryId,
    categoryName: row.categoryName,
    categoryColor: isCategoryColorToken(row.categoryColor)
      ? row.categoryColor
      : getDefaultCategoryColor(row.categoryId),
    categoryIcon: resolveCategoryIcon(row.categoryIcon),
    categoryActive: row.categoryActive,
    categoryType,
    context: row.context,
    archivedAt: row.archivedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function queryNotes(archived: boolean): Promise<NoteRow[]> {
  const householdId = await requireActiveHouseholdId();
  const rows = await db
    .select({
      id: notes.id,
      merchant: notes.merchant,
      date: notes.date,
      value: notes.value,
      categoryId: notes.categoryId,
      categoryName: categories.name,
      categoryColor: categories.color,
      categoryIcon: categories.icon,
      categoryActive: categories.active,
      categoryType: categories.type,
      context: notes.context,
      archivedAt: notes.archivedAt,
      createdAt: notes.createdAt,
      updatedAt: notes.updatedAt,
    })
    .from(notes)
    .innerJoin(categories, eq(notes.categoryId, categories.id))
    .where(
      and(
        eq(notes.householdId, householdId),
        archived ? isNotNull(notes.archivedAt) : isNull(notes.archivedAt),
      ),
    )
    .orderBy(asc(notes.date), asc(notes.createdAt));

  return rows
    .map((row) => mapNoteRow(row))
    .filter((row): row is NoteRow => row !== null);
}

export async function getActiveNotes(): Promise<NoteRow[]> {
  return queryNotes(false);
}

export async function getArchivedNotes(): Promise<NoteRow[]> {
  return queryNotes(true);
}

export async function getNoteEligibleCategories(): Promise<NoteCategoryOption[]> {
  const householdId = await requireActiveHouseholdId();
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      color: categories.color,
      icon: categories.icon,
      type: categories.type,
      active: categories.active,
    })
    .from(categories)
    .where(eq(categories.householdId, householdId))
    .orderBy(asc(categories.priority));

  return rows
    .map((row) => {
      const type = resolveCategoryType(row.type);

      if (!row.active || !isNoteEligibleCategoryType(type)) {
        return null;
      }

      return {
        id: row.id,
        name: row.name,
        color: isCategoryColorToken(row.color)
          ? row.color
          : getDefaultCategoryColor(row.id),
        icon: resolveCategoryIcon(row.icon),
        type,
      };
    })
    .filter((row): row is NoteCategoryOption => row !== null);
}

export async function getNoteById(id: string): Promise<NoteRow | null> {
  const householdId = await requireActiveHouseholdId();
  const rows = await db
    .select({
      id: notes.id,
      merchant: notes.merchant,
      date: notes.date,
      value: notes.value,
      categoryId: notes.categoryId,
      categoryName: categories.name,
      categoryColor: categories.color,
      categoryIcon: categories.icon,
      categoryActive: categories.active,
      categoryType: categories.type,
      context: notes.context,
      archivedAt: notes.archivedAt,
      createdAt: notes.createdAt,
      updatedAt: notes.updatedAt,
    })
    .from(notes)
    .innerJoin(categories, eq(notes.categoryId, categories.id))
    .where(and(eq(notes.householdId, householdId), eq(notes.id, id)))
    .limit(1);

  const row = rows[0];

  if (!row) {
    return null;
  }

  return mapNoteRow(row);
}
