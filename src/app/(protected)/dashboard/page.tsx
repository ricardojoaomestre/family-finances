import { auth } from '@/auth';

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="flex flex-1 flex-col items-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-muted-foreground">
        Welcome, {session?.user?.name ?? session?.user?.email}
      </p>
      <p className="text-sm text-muted-foreground">
        User id: {session?.user?.id}
      </p>
    </div>
  );
}
