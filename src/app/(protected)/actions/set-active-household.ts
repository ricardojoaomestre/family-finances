'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { auth } from '@/auth';
import { db } from '@/db';
import { householdMembers, users } from '@/db/schema';

export type SetActiveHouseholdResult =
  | { ok: true }
  | { ok: false; error: string };

export async function setActiveHousehold(
  householdId: string,
): Promise<SetActiveHouseholdResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return { ok: false, error: 'You must be signed in.' };
  }

  const [membership] = await db
    .select({ householdId: householdMembers.householdId })
    .from(householdMembers)
    .where(
      and(
        eq(householdMembers.userId, session.user.id),
        eq(householdMembers.householdId, householdId),
      ),
    )
    .limit(1);

  if (!membership) {
    return { ok: false, error: 'You are not a member of that household.' };
  }

  await db
    .update(users)
    .set({ activeHouseholdId: householdId })
    .where(eq(users.id, session.user.id));

  revalidatePath('/', 'layout');

  return { ok: true };
}
