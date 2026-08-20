import { PermitHistoryPage } from "@/components/PermitHistoryPage";
import { requireRole } from "@/lib/auth";

export default async function ManagerHistoryPage({ searchParams }: { searchParams: Promise<{ wing?: string; kelas?: string; period?: string }> }) {
  const session = await requireRole("MANAGER");
  const params = await searchParams;
  return <PermitHistoryPage role="MANAGER" name={session.name} basePath="/manager/history" searchParams={params} />;
}
