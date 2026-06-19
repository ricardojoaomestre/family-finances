import { auth } from '@/auth';
import { ProtectedShell } from '@/app/(protected)/components/protected-shell';
import { ensureActiveHousehold } from '@/lib/household/ensure-active-household';
import { getHouseholdsForUser } from '@/lib/household/get-households-for-user';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    const headersList = await headers();
    const pathname =
      headersList.get('x-pathname') ??
      headersList.get('next-url')?.split('?')[0] ??
      '/dashboard';
    redirect(`/?callbackUrl=${encodeURIComponent(pathname)}`);
  }

  const activeHouseholdId = await ensureActiveHousehold(session.user.id);
  const households = await getHouseholdsForUser(session.user.id);

  return (
    <ProtectedShell
      userName={session.user.name}
      userEmail={session.user.email}
      userImage={session.user.image}
      households={households}
      activeHouseholdId={activeHouseholdId}
    >
      {children}
    </ProtectedShell>
  );
}
