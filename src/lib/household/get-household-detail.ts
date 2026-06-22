import { and, asc, eq } from 'drizzle-orm';

import { db } from '@/db';
import {
  type HouseholdInviteStatus,
  type HouseholdMemberRole,
  householdInvites,
  householdMembers,
  households,
  users,
} from '@/db/schema';
import { getBankAccountsForHousehold } from '@/lib/bank-accounts/get-bank-accounts';

export type HouseholdMemberRow = {
  userId: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: HouseholdMemberRole;
  isCurrentUser: boolean;
};

export type HouseholdInviteRow = {
  id: string;
  email: string;
  role: HouseholdMemberRole;
  createdAt: Date;
};

export type HouseholdBankAccountOption = {
  id: string;
  label: string;
};

export type HouseholdDetail = {
  id: string;
  name: string;
  primaryBankAccountId: string | null;
  bankAccounts: HouseholdBankAccountOption[];
  currentUserRole: HouseholdMemberRole;
  members: HouseholdMemberRow[];
  pendingInvites: HouseholdInviteRow[];
};

export async function getHouseholdDetail(
  householdId: string,
  currentUserId: string,
): Promise<HouseholdDetail | null> {
  const [household] = await db
    .select({
      id: households.id,
      name: households.name,
      primaryBankAccountId: households.primaryBankAccountId,
    })
    .from(households)
    .where(eq(households.id, householdId))
    .limit(1);

  if (!household) {
    return null;
  }

  const [bankAccountRows, memberRows, pendingInvites] = await Promise.all([
    getBankAccountsForHousehold(householdId),
    db
      .select({
        userId: householdMembers.userId,
        role: householdMembers.role,
        name: users.name,
        email: users.email,
        image: users.image,
        createdAt: householdMembers.createdAt,
      })
      .from(householdMembers)
      .innerJoin(users, eq(householdMembers.userId, users.id))
      .where(eq(householdMembers.householdId, householdId))
      .orderBy(asc(householdMembers.createdAt)),
    db
      .select({
        id: householdInvites.id,
        email: householdInvites.email,
        role: householdInvites.role,
        createdAt: householdInvites.createdAt,
      })
      .from(householdInvites)
      .where(
        and(
          eq(householdInvites.householdId, householdId),
          eq(
            householdInvites.status,
            'pending' satisfies HouseholdInviteStatus,
          ),
        ),
      )
      .orderBy(asc(householdInvites.createdAt)),
  ]);

  const currentMember = memberRows.find(
    (member) => member.userId === currentUserId,
  );

  if (!currentMember) {
    return null;
  }

  return {
    id: household.id,
    name: household.name,
    primaryBankAccountId: household.primaryBankAccountId,
    bankAccounts: bankAccountRows.map((account) => ({
      id: account.id,
      label: account.label,
    })),
    currentUserRole: currentMember.role,
    members: memberRows.map((member) => ({
      userId: member.userId,
      name: member.name,
      email: member.email,
      image: member.image,
      role: member.role,
      isCurrentUser: member.userId === currentUserId,
    })),
    pendingInvites,
  };
}
