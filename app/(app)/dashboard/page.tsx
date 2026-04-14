import { getSession } from "@/lib/auth/session";

export default async function DashboardPage() {
  const session = await getSession();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Dashboard
      </h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        Welcome back, {session?.email}
      </p>
    </div>
  );
}
