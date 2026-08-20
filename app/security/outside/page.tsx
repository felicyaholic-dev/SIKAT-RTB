import { PermitHistoryPage } from "@/components/PermitHistoryPage";
import { requireRole } from "@/lib/auth";

export default async function SecurityOutsidePage({ searchParams }: { searchParams: Promise<{ wing?: string; kelas?: string; period?: string }> }) {
  const session = await requireRole("SECURITY");
  const params = await searchParams;
  return <PermitHistoryPage role="SECURITY" name={session.name} basePath="/security/outside" searchParams={params} />;
}
