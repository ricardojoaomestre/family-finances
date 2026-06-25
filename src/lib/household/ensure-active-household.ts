import { cache } from 'react';
import { asc, eq } from 'drizzle-orm';

import { db } from '@/db';
import { householdMembers, households, users } from '@/db/schema';
import { seedDefaultCategoriesForHousehold } from '@/lib/household/default-categories';
import { pickActiveHouseholdId } from '@/lib/household/pick-active-household-id';

function buildPersonalHouseholdName(
  name: string | null,
  email: string | null,
): string {
  const owner = name?.trim() || email?.trim()?.split('@')[0];
  return owner ? `${owner}'s household` : 'My household';
}

/**
 * Guarantees the signed-in user has a household and a valid active selection.
 * Creates a personal household (seeded with default categories) on first use.
 * Safe to call on every protected request.
 */
export const ensureActiveHousehold = cache(async (userId: string): Promise<string> => {
  const [user] = await db
    .select({
      name: users.name,
      email: users.email,
      activeHouseholdId: users.activeHouseholdId,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw new Error('Signed-in user not found.');
  }

  const memberships = await db
    .select({ householdId: householdMembers.householdId })
    .from(householdMembers)
    .where(eq(householdMembers.userId, userId))
    .orderBy(asc(householdMembers.createdAt));

  if (memberships.length === 0) {
    const [created] = await db
      .insert(households)
      .values({ name: buildPersonalHouseholdName(user.name, user.email) })
      .returning({ id: households.id });

    const householdId = created!.id;

    await db.insert(householdMembers).values({
      householdId,
      userId,
      role: 'owner',
    });

    await seedDefaultCategoriesForHousehold(householdId);

    await db
      .update(users)
      .set({ activeHouseholdId: householdId })
      .where(eq(users.id, userId));

    return householdId;
  }

  const resolvedHouseholdId = pickActiveHouseholdId(
    user.activeHouseholdId,
    memberships.map((row) => row.householdId),
  )!;

  if (resolvedHouseholdId !== user.activeHouseholdId) {
    await db
      .update(users)
      .set({ activeHouseholdId: resolvedHouseholdId })
      .where(eq(users.id, userId));
  }

  return resolvedHouseholdId;
});
