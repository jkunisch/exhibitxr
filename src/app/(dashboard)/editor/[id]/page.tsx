import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import EditorShell from "@/components/editor/EditorShell";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

interface EditorPageProps {
    params: Promise<{ id: string }>;
}

export default async function EditorPage({ params }: EditorPageProps) {
    const sessionUser = await getSessionUser();

    if (!sessionUser) {
        redirect("/login?next=/dashboard");
    }

    const { id: exhibitId } = await params;

    return (
        <EditorShell tenantId={sessionUser.tenantId} exhibitId={exhibitId} />
    );
}
