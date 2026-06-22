/**
 * Picks which household the user should act within given their stored preference
 * and ordered membership list (oldest first).
 *
 * Returns null when the user has no memberships (caller must create one).
 */
export function pickActiveHouseholdId(
  activeHouseholdId: string | null | undefined,
  membershipHouseholdIds: string[],
): string | null {
  if (membershipHouseholdIds.length === 0) {
    return null;
  }

  const membershipIds = new Set(membershipHouseholdIds);

  if (activeHouseholdId && membershipIds.has(activeHouseholdId)) {
    return activeHouseholdId;
  }

  return membershipHouseholdIds[0]!;
}
