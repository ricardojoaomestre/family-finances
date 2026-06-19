import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { HouseholdManager } from '@/app/(protected)/settings/household/components/household-manager';
import { ensureActiveHousehold } from '@/lib/household/ensure-active-household';
import { getHouseholdDetail } from '@/lib/household/get-household-detail';

export default async function HouseholdSettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/');
  }

  const householdId = await ensureActiveHousehold(session.user.id);
  const detail = await getHouseholdDetail(householdId, session.user.id);

  if (!detail) {
    redirect('/dashboard');
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-semibold">Household</h1>
        <p className="text-sm text-muted-foreground">
          Manage who shares this household&apos;s accounts and transactions.
        </p>
      </div>
      <HouseholdManager detail={detail} />
    </div>
  );
}
