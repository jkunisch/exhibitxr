import Link from "next/link";
import { redirect } from "next/navigation";

import { createExhibitionAction } from "@/app/actions/exhibitions";
import { GlassFormPanel } from "@/components/ui/GlassFormPanel";
import { getSessionUser } from "@/lib/session";

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

  async function handleCreateExhibition(formData: FormData) {
    "use server";

    const result = await createExhibitionAction(formData);
    if (!result.ok) {
      redirect(
        `/dashboard/exhibitions/new?error=${encodeURIComponent(result.error)}`,
      );
    }

    redirect(`/dashboard/exhibitions/${result.exhibitionId}?created=1`);
  }

  return (
    <section className="space-y-4">
      <Link
        href="/dashboard/exhibitions"
        className="inline-flex rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/15"
      >
        Back to Exhibitions
      </Link>

      {errorMessage ? (
        <p className="rounded-xl border border-rose-300/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {errorMessage}
        </p>
      ) : null}

      <GlassFormPanel
        title="Create Exhibition"
        subtitle="Create a tenant-scoped exhibition document."
      >
        <form action={handleCreateExhibition} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium text-slate-800 dark:text-slate-100">
              Title
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              minLength={2}
              maxLength={120}
              className="w-full rounded-xl border border-slate-300/60 bg-white/75 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-500/70 focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-400/35 dark:border-white/20 dark:bg-black/25 dark:text-white dark:placeholder:text-white/45"
              placeholder="Premium Product Showcase"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="description"
              className="text-sm font-medium text-slate-800 dark:text-slate-100"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              maxLength={2000}
              className="w-full rounded-xl border border-slate-300/60 bg-white/75 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-500/70 focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-400/35 dark:border-white/20 dark:bg-black/25 dark:text-white dark:placeholder:text-white/45"
              placeholder="High-level summary for your team."
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="environment"
              className="text-sm font-medium text-slate-800 dark:text-slate-100"
            >
              Environment Preset
            </label>
            <select
              id="environment"
              name="environment"
              defaultValue="studio"
              className="w-full rounded-xl border border-slate-300/60 bg-white/75 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-400/35 dark:border-white/20 dark:bg-black/25 dark:text-white"
            >
              {ENVIRONMENT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-800 dark:text-slate-100">
            <input
              type="checkbox"
              name="isPublished"
              className="h-4 w-4 rounded border-slate-400 text-cyan-500 focus:ring-cyan-400/50 dark:border-white/30"
            />
            Publish immediately
          </label>

          <button
            type="submit"
            className="rounded-xl border border-cyan-500/45 bg-cyan-500/20 px-4 py-2.5 text-sm font-medium text-slate-900 transition hover:bg-cyan-500/30 dark:text-white"
          >
            Create Exhibition
          </button>
        </form>
      </GlassFormPanel>
    </section>
  );
}

