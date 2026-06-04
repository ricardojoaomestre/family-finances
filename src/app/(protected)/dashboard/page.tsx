import { auth } from '@/auth';

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome, {session?.user?.name ?? session?.user?.email}
        </p>
      </div>
      <p className="text-sm text-muted-foreground">
        User id: {session?.user?.id}
      </p>
    </div>
  );
}
