import { cache } from 'react';
import { and, asc, eq } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db';
import { householdMembers, users } from '@/db/schema';
import { ensureActiveHousehold } from '@/lib/household/ensure-active-household';

/**
 * Resolves the household the signed-in user is currently acting within.
 *
 * Reads the user's stored preference and verifies membership; falls back to the
 * user's oldest membership. Memoized per request so loaders can call it freely.
 */
export const getActiveHouseholdId = cache(async (): Promise<string | null> => {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  const [user] = await db
    .select({ activeHouseholdId: users.activeHouseholdId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (user?.activeHouseholdId) {
    const [membership] = await db
      .select({ householdId: householdMembers.householdId })
      .from(householdMembers)
      .where(
        and(
          eq(householdMembers.userId, userId),
          eq(householdMembers.householdId, user.activeHouseholdId),
        ),
      )
      .limit(1);

    if (membership) {
      return membership.householdId;
    }
  }

  const [fallback] = await db
    .select({ householdId: householdMembers.householdId })
    .from(householdMembers)
    .where(eq(householdMembers.userId, userId))
    .orderBy(asc(householdMembers.createdAt))
    .limit(1);

  return fallback?.householdId ?? null;
});

/**
 * Same as {@link getActiveHouseholdId} but guarantees a household.
 *
 * Falls back to creating the user's personal household if one does not exist
 * yet, so loaders never race against the protected layout on first sign-in.
 */
export async function requireActiveHouseholdId(): Promise<string> {
  const householdId = await getActiveHouseholdId();

  if (householdId) {
    return householdId;
  }

  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('No active household for the current user.');
  }

  return ensureActiveHousehold(session.user.id);
}
