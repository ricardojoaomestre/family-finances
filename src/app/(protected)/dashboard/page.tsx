import { DashboardPageContent } from '@/app/(protected)/dashboard/components/dashboard-page-content';
import { auth } from '@/auth';

export default async function DashboardPage() {
  const session = await auth();

  return (
    <DashboardPageContent
      welcomeMessage={`Welcome, ${session?.user?.name ?? session?.user?.email}`}
    />
  );
}
