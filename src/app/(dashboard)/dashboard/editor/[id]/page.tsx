import { redirect } from "next/navigation";

import EditorShell from "@/components/editor/EditorShell";
import { getSessionUser } from "@/lib/session";
import { getConciergeStatus } from "@/app/actions/upsell";
import { getAdminAuth } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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
  const [conciergeStatus, customToken] = await Promise.all([
    getConciergeStatus(exhibitId, sessionUser.tenantId),
    getAdminAuth().createCustomToken(sessionUser.uid, {
      tenantId: sessionUser.tenantId,
      role: sessionUser.role ?? "owner",
    }),
  ]);

  return (
    <EditorShell
      tenantId={sessionUser.tenantId}
      exhibitId={exhibitId}
      initialConciergeStatus={conciergeStatus}
      firebaseCustomToken={customToken}
    />
  );
}
