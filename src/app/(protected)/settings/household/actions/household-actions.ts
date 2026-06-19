'use server';

import { and, eq, ne } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { auth } from '@/auth';
import { db } from '@/db';
import {
  type HouseholdMemberRole,
  householdInvites,
  householdMembers,
  households,
  users,
} from '@/db/schema';
import { getActiveHouseholdId } from '@/lib/household/active-household';
import { seedDefaultCategoriesForHousehold } from '@/lib/household/default-categories';
import { formatDbError } from '@/lib/db/format-db-error';

type ActionResult = { ok: true } | { ok: false; error: string };

const MAX_HOUSEHOLD_NAME_LENGTH = 80;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

async function getCurrentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

async function getMemberRole(
  userId: string,
  householdId: string,
): Promise<HouseholdMemberRole | null> {
  const [member] = await db
    .select({ role: householdMembers.role })
    .from(householdMembers)
    .where(
      and(
        eq(householdMembers.userId, userId),
        eq(householdMembers.householdId, householdId),
      ),
    )
    .limit(1);

  return member?.role ?? null;
}

function revalidateHousehold() {
  revalidatePath('/settings/household');
  revalidatePath('/', 'layout');
}

export async function createHousehold(
  name: string,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const userId = await getCurrentUserId();

  if (!userId) {
    return { ok: false, error: 'You must be signed in.' };
  }

  const trimmed = normalizeName(name);

  if (!trimmed) {
    return { ok: false, error: 'Enter a household name.' };
  }

  if (trimmed.length > MAX_HOUSEHOLD_NAME_LENGTH) {
    return { ok: false, error: 'Household name is too long.' };
  }

  try {
    const [created] = await db
      .insert(households)
      .values({ name: trimmed })
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

    revalidateHousehold();

    return { ok: true, id: householdId };
  } catch (error) {
    console.error('[createHousehold]', error);
    return { ok: false, error: formatDbError(error, 'Could not create household') };
  }
}

export async function renameHousehold(name: string): Promise<ActionResult> {
  const userId = await getCurrentUserId();

  if (!userId) {
    return { ok: false, error: 'You must be signed in.' };
  }

  const householdId = await getActiveHouseholdId();

  if (!householdId) {
    return { ok: false, error: 'No active household selected.' };
  }

  if ((await getMemberRole(userId, householdId)) !== 'owner') {
    return { ok: false, error: 'Only the household owner can rename it.' };
  }

  const trimmed = normalizeName(name);

  if (!trimmed) {
    return { ok: false, error: 'Enter a household name.' };
  }

  if (trimmed.length > MAX_HOUSEHOLD_NAME_LENGTH) {
    return { ok: false, error: 'Household name is too long.' };
  }

  try {
    await db
      .update(households)
      .set({ name: trimmed, updatedAt: new Date() })
      .where(eq(households.id, householdId));

    revalidateHousehold();
    return { ok: true };
  } catch (error) {
    console.error('[renameHousehold]', error);
    return { ok: false, error: formatDbError(error, 'Could not rename household') };
  }
}

export async function inviteMember(
  email: string,
  role: HouseholdMemberRole = 'member',
): Promise<{ ok: true; token: string } | { ok: false; error: string }> {
  const userId = await getCurrentUserId();

  if (!userId) {
    return { ok: false, error: 'You must be signed in.' };
  }

  const householdId = await getActiveHouseholdId();

  if (!householdId) {
    return { ok: false, error: 'No active household selected.' };
  }

  if ((await getMemberRole(userId, householdId)) !== 'owner') {
    return { ok: false, error: 'Only the household owner can invite members.' };
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!EMAIL_RE.test(normalizedEmail)) {
    return { ok: false, error: 'Enter a valid email address.' };
  }

  const existingMember = await db
    .select({ userId: householdMembers.userId })
    .from(householdMembers)
    .innerJoin(users, eq(householdMembers.userId, users.id))
    .where(
      and(
        eq(householdMembers.householdId, householdId),
        eq(users.email, normalizedEmail),
      ),
    )
    .limit(1);

  if (existingMember.length > 0) {
    return { ok: false, error: 'That person is already a member.' };
  }

  const token = crypto.randomUUID();

  try {
    await db
      .insert(householdInvites)
      .values({
        householdId,
        email: normalizedEmail,
        role: role === 'owner' ? 'owner' : 'member',
        token,
        invitedByUserId: userId,
        status: 'pending',
      })
      .onConflictDoUpdate({
        target: [householdInvites.householdId, householdInvites.email],
        targetWhere: eq(householdInvites.status, 'pending'),
        set: { token, role: role === 'owner' ? 'owner' : 'member' },
      });

    revalidateHousehold();
    return { ok: true, token };
  } catch (error) {
    console.error('[inviteMember]', error);
    return { ok: false, error: formatDbError(error, 'Could not create invite') };
  }
}

export async function revokeInvite(inviteId: string): Promise<ActionResult> {
  const userId = await getCurrentUserId();

  if (!userId) {
    return { ok: false, error: 'You must be signed in.' };
  }

  const householdId = await getActiveHouseholdId();

  if (!householdId) {
    return { ok: false, error: 'No active household selected.' };
  }

  if ((await getMemberRole(userId, householdId)) !== 'owner') {
    return { ok: false, error: 'Only the household owner can revoke invites.' };
  }

  try {
    await db
      .update(householdInvites)
      .set({ status: 'revoked' })
      .where(
        and(
          eq(householdInvites.id, inviteId),
          eq(householdInvites.householdId, householdId),
        ),
      );

    revalidateHousehold();
    return { ok: true };
  } catch (error) {
    console.error('[revokeInvite]', error);
    return { ok: false, error: formatDbError(error, 'Could not revoke invite') };
  }
}

export async function removeMember(targetUserId: string): Promise<ActionResult> {
  const userId = await getCurrentUserId();

  if (!userId) {
    return { ok: false, error: 'You must be signed in.' };
  }

  const householdId = await getActiveHouseholdId();

  if (!householdId) {
    return { ok: false, error: 'No active household selected.' };
  }

  if ((await getMemberRole(userId, householdId)) !== 'owner') {
    return { ok: false, error: 'Only the household owner can remove members.' };
  }

  if (targetUserId === userId) {
    return { ok: false, error: 'Use "Leave household" to remove yourself.' };
  }

  try {
    await db
      .delete(householdMembers)
      .where(
        and(
          eq(householdMembers.householdId, householdId),
          eq(householdMembers.userId, targetUserId),
        ),
      );

    await db
      .update(users)
      .set({ activeHouseholdId: null })
      .where(
        and(
          eq(users.id, targetUserId),
          eq(users.activeHouseholdId, householdId),
        ),
      );

    revalidateHousehold();
    return { ok: true };
  } catch (error) {
    console.error('[removeMember]', error);
    return { ok: false, error: formatDbError(error, 'Could not remove member') };
  }
}

export async function leaveHousehold(): Promise<ActionResult> {
  const userId = await getCurrentUserId();

  if (!userId) {
    return { ok: false, error: 'You must be signed in.' };
  }

  const householdId = await getActiveHouseholdId();

  if (!householdId) {
    return { ok: false, error: 'No active household selected.' };
  }

  const role = await getMemberRole(userId, householdId);

  if (!role) {
    return { ok: false, error: 'You are not a member of this household.' };
  }

  const otherMembers = await db
    .select({ userId: householdMembers.userId, role: householdMembers.role })
    .from(householdMembers)
    .where(
      and(
        eq(householdMembers.householdId, householdId),
        ne(householdMembers.userId, userId),
      ),
    );

  if (otherMembers.length === 0) {
    return {
      ok: false,
      error: 'You are the only member. Delete the household instead.',
    };
  }

  if (
    role === 'owner' &&
    !otherMembers.some((member) => member.role === 'owner')
  ) {
    return {
      ok: false,
      error: 'Make another member an owner before you leave.',
    };
  }

  try {
    await db
      .delete(householdMembers)
      .where(
        and(
          eq(householdMembers.householdId, householdId),
          eq(householdMembers.userId, userId),
        ),
      );

    await db
      .update(users)
      .set({ activeHouseholdId: null })
      .where(eq(users.id, userId));

    revalidateHousehold();
    return { ok: true };
  } catch (error) {
    console.error('[leaveHousehold]', error);
    return { ok: false, error: formatDbError(error, 'Could not leave household') };
  }
}

export async function acceptInvite(token: string): Promise<ActionResult> {
  const session = await auth();
  const userId = session?.user?.id;
  const sessionEmail = session?.user?.email?.toLowerCase() ?? null;

  if (!userId) {
    return { ok: false, error: 'You must be signed in to accept an invite.' };
  }

  const [invite] = await db
    .select({
      id: householdInvites.id,
      householdId: householdInvites.householdId,
      email: householdInvites.email,
      role: householdInvites.role,
      status: householdInvites.status,
    })
    .from(householdInvites)
    .where(eq(householdInvites.token, token))
    .limit(1);

  if (!invite || invite.status !== 'pending') {
    return { ok: false, error: 'This invite is no longer valid.' };
  }

  if (!sessionEmail) {
    return {
      ok: false,
      error: 'Your account must have an email address to accept this invite.',
    };
  }

  if (invite.email.toLowerCase() !== sessionEmail) {
    return {
      ok: false,
      error: 'This invite was sent to a different email address.',
    };
  }

  try {
    await db
      .insert(householdMembers)
      .values({
        householdId: invite.householdId,
        userId,
        role: invite.role,
      })
      .onConflictDoNothing();

    await db
      .update(householdInvites)
      .set({ status: 'accepted' })
      .where(eq(householdInvites.id, invite.id));

    await db
      .update(users)
      .set({ activeHouseholdId: invite.householdId })
      .where(eq(users.id, userId));

    revalidateHousehold();
    return { ok: true };
  } catch (error) {
    console.error('[acceptInvite]', error);
    return { ok: false, error: formatDbError(error, 'Could not accept invite') };
  }
}
