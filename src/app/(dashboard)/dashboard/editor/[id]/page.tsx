import { redirect } from "next/navigation";

import EditorShell from "@/components/editor/EditorShell";
import { getSessionUser } from "@/lib/session";
import { getConciergeStatus } from "@/app/actions/upsell";

export const dynamic = "force-dynamic";

interface DashboardEditorPageProps {
  params: Promise<{ id: string }>;
}

export default async function DashboardEditorPage({
  params,
}: DashboardEditorPageProps) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect("/login?next=/dashboard");
  }

  const { id: exhibitId } = await params;
  const conciergeStatus = await getConciergeStatus(exhibitId, sessionUser.tenantId);

  return (
    <EditorShell 
      tenantId={sessionUser.tenantId} 
      exhibitId={exhibitId} 
      initialConciergeStatus={conciergeStatus}
    />
  );
}
