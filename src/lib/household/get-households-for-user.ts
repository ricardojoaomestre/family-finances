import { asc, eq } from 'drizzle-orm';

import { db } from '@/db';
import {
  type HouseholdMemberRole,
  householdMembers,
  households,
} from '@/db/schema';

export type UserHousehold = {
  id: string;
  name: string;
  role: HouseholdMemberRole;
};

export async function getHouseholdsForUser(
  userId: string,
): Promise<UserHousehold[]> {
  return db
    .select({
      id: households.id,
      name: households.name,
      role: householdMembers.role,
    })
    .from(householdMembers)
    .innerJoin(households, eq(householdMembers.householdId, households.id))
    .where(eq(householdMembers.userId, userId))
    .orderBy(asc(households.createdAt));
}
