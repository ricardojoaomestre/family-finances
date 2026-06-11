import { SetPageHeader } from '@/app/(protected)/components/protected-page-context';
import { auth } from '@/auth';

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <SetPageHeader
        description={`Welcome, ${session?.user?.name ?? session?.user?.email}`}
      />
      <p className="text-sm text-muted-foreground">
        User id: {session?.user?.id}
      </p>
    </div>
  );
}
