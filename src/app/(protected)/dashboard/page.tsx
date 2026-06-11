import { auth } from '@/auth';
import { PageHeader } from '@/components/page-header';

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        title="Dashboard"
        description={`Welcome, ${session?.user?.name ?? session?.user?.email}`}
      />
      <p className="text-sm text-muted-foreground">
        User id: {session?.user?.id}
      </p>
    </div>
  );
}
