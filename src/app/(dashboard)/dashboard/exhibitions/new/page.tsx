import Link from "next/link";
import { redirect } from "next/navigation";

import { GlassFormPanel } from "@/components/ui/GlassFormPanel";
import { getSessionUser } from "@/lib/session";
import NewExhibitionForm from "./NewExhibitionForm";

export const dynamic = "force-dynamic";

const ENVIRONMENT_OPTIONS = ["studio", "city", "sunset", "dawn", "night"] as const;

type NewExhibitionSearchParams = Promise<{
  error?: string | string[];
}>;

function normalizeError(input: string | string[] | undefined): string | null {
  if (typeof input !== "string" || input.trim().length === 0) {
    return null;
  }

  return input;
}

export default async function NewExhibitionPage({
  searchParams,
}: {
  searchParams: NewExhibitionSearchParams;
}) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect("/login?next=/dashboard/exhibitions/new");
  }

  const resolvedSearchParams = await searchParams;
  const errorMessage = normalizeError(resolvedSearchParams.error);

  return (
    <section className="space-y-4">
      <Link
        href="/dashboard/exhibitions"
        className="inline-flex rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/15"
      >
        Back to Exhibitions
      </Link>

      <GlassFormPanel
        title="Create Exhibition"
        subtitle="Create a tenant-scoped exhibition document."
      >
        <NewExhibitionForm
          tenantId={sessionUser.tenantId}
          environmentOptions={ENVIRONMENT_OPTIONS}
          initialErrorMessage={errorMessage}
        />
      </GlassFormPanel>
    </section>
  );
}

