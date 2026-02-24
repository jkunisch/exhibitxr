import { Timestamp } from "firebase-admin/firestore";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import {
  deleteExhibitionAction,
  updateExhibitionAction,
} from "@/app/actions/exhibitions";
import { GlassFormPanel } from "@/components/ui/GlassFormPanel";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { getSessionUser } from "@/lib/session";
import CopyTextButton from "./CopyTextButton";

export const dynamic = "force-dynamic";

const ENVIRONMENT_OPTIONS = ["studio", "city", "sunset", "dawn", "night"] as const;

type PageParams = Promise<{
  id: string;
}>;

type PageSearchParams = Promise<{
  created?: string | string[];
  saved?: string | string[];
  error?: string | string[];
  deleteError?: string | string[];
}>;

type ExhibitionRecord = {
  id: string;
  title: string;
  description: string;
  isPublished: boolean;
  environment: (typeof ENVIRONMENT_OPTIONS)[number];
  glbUrl: string;
  createdAtLabel: string;
  updatedAtLabel: string;
};

function asNonEmptyString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : fallback;
}

function asEnvironment(value: unknown): (typeof ENVIRONMENT_OPTIONS)[number] {
  if (typeof value !== "string") {
    return "studio";
  }

  const option = ENVIRONMENT_OPTIONS.find((item) => item === value);
  return option ?? "studio";
}

function formatDate(value: unknown): string {
  if (value instanceof Timestamp) {
    return value.toDate().toLocaleString("de-DE");
  }

  if (value instanceof Date) {
    return value.toLocaleString("de-DE");
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleString("de-DE");
    }
  }

  return "No timestamp";
}

function normalizeMessage(input: string | string[] | undefined): string | null {
  if (typeof input !== "string" || input.trim().length === 0) {
    return null;
  }

  return input;
}

function asSuccessFlag(input: string | string[] | undefined): boolean {
  return input === "1";
}

async function getRequestOrigin(): Promise<string> {
  const headerStore = await headers();
  const forwardedHost = headerStore.get("x-forwarded-host");
  const host = forwardedHost ?? headerStore.get("host");
  const forwardedProto = headerStore.get("x-forwarded-proto");

  if (host && host.trim().length > 0) {
    const protocol = forwardedProto && forwardedProto.trim().length > 0
      ? forwardedProto
      : "https";
    return `${protocol}://${host}`;
  }

  const fallbackOrigin = process.env.NEXT_PUBLIC_APP_URL;
  if (fallbackOrigin && fallbackOrigin.trim().length > 0) {
    return fallbackOrigin.replace(/\/+$/, "");
  }

  return "https://exhibitxr.app";
}

async function loadExhibition(
  tenantId: string,
  exhibitionId: string,
): Promise<ExhibitionRecord | null> {
  const adminDb = getAdminDb();
  const snapshot = await adminDb
    .collection("tenants")
    .doc(tenantId)
    .collection("exhibitions")
    .doc(exhibitionId)
    .get();

  if (!snapshot.exists) {
    return null;
  }

  const data = snapshot.data();
  if (!data) {
    return null;
  }

  const dataTenantId =
    typeof data.tenantId === "string" ? data.tenantId : tenantId;
  if (dataTenantId !== tenantId) {
    return null;
  }

  return {
    id: snapshot.id,
    title: asNonEmptyString(data.title, "Untitled exhibition"),
    description: asNonEmptyString(data.description, ""),
    isPublished: data.isPublished === true,
    environment: asEnvironment(data.environment),
    glbUrl: asNonEmptyString(data.glbUrl ?? data.model?.glbUrl, ""),
    createdAtLabel: formatDate(data.createdAt),
    updatedAtLabel: formatDate(data.updatedAt),
  };
}

export default async function ExhibitionDetailPage({
  params,
  searchParams,
}: {
  params: PageParams;
  searchParams: PageSearchParams;
}) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect("/login?next=/dashboard/exhibitions");
  }

  const resolvedParams = await params;
  const exhibition = await loadExhibition(sessionUser.tenantId, resolvedParams.id);
  if (!exhibition) {
    notFound();
  }

  const resolvedSearchParams = await searchParams;
  const created = asSuccessFlag(resolvedSearchParams.created);
  const saved = asSuccessFlag(resolvedSearchParams.saved);
  const errorMessage = normalizeMessage(resolvedSearchParams.error);
  const deleteErrorMessage = normalizeMessage(resolvedSearchParams.deleteError);
  const editorUrl = `/dashboard/editor/${exhibition.id}`;
  const origin = await getRequestOrigin();
  const embedUrl = `${origin}/embed/${exhibition.id}`;
  const embedIframeCode = `<iframe src="${embedUrl}" width="100%" height="600" frameborder="0"></iframe>`;

  async function handleUpdate(formData: FormData) {
    "use server";

    const result = await updateExhibitionAction(formData);
    if (!result.ok) {
      redirect(
        `/dashboard/exhibitions/${resolvedParams.id}?error=${encodeURIComponent(result.error)}`,
      );
    }

    redirect(`/dashboard/exhibitions/${resolvedParams.id}?saved=1`);
  }

  async function handleDelete(formData: FormData) {
    "use server";

    const result = await deleteExhibitionAction(formData);
    if (!result.ok) {
      redirect(
        `/dashboard/exhibitions/${resolvedParams.id}?deleteError=${encodeURIComponent(result.error)}`,
      );
    }

    redirect("/dashboard/exhibitions?deleted=1");
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/dashboard/exhibitions"
          className="inline-flex rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/15"
        >
          Back to Exhibitions
        </Link>
        <Link
          href={editorUrl}
          className="inline-flex rounded-lg border border-cyan-300/35 bg-cyan-300/20 px-3 py-2 text-xs font-semibold text-cyan-50 transition hover:bg-cyan-300/30"
        >
          Im Editor oeffnen
        </Link>
      </div>

      {created ? (
        <p className="rounded-xl border border-emerald-300/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          Exhibition created successfully.
        </p>
      ) : null}

      {saved ? (
        <p className="rounded-xl border border-emerald-300/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          Changes saved.
        </p>
      ) : null}

      {errorMessage ? (
        <p className="rounded-xl border border-rose-300/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {errorMessage}
        </p>
      ) : null}

      {deleteErrorMessage ? (
        <p className="rounded-xl border border-rose-300/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {deleteErrorMessage}
        </p>
      ) : null}

      <GlassFormPanel
        title={`Edit Exhibition: ${exhibition.title}`}
        subtitle={`Created: ${exhibition.createdAtLabel} • Updated: ${exhibition.updatedAtLabel}`}
      >
        <form action={handleUpdate} className="space-y-4">
          <input type="hidden" name="exhibitionId" value={exhibition.id} />

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
              defaultValue={exhibition.title}
              className="w-full rounded-xl border border-slate-300/60 bg-white/75 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-500/70 focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-400/35 dark:border-white/20 dark:bg-black/25 dark:text-white dark:placeholder:text-white/45"
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
              defaultValue={exhibition.description}
              className="w-full rounded-xl border border-slate-300/60 bg-white/75 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-500/70 focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-400/35 dark:border-white/20 dark:bg-black/25 dark:text-white dark:placeholder:text-white/45"
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
              defaultValue={exhibition.environment}
              className="w-full rounded-xl border border-slate-300/60 bg-white/75 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-400/35 dark:border-white/20 dark:bg-black/25 dark:text-white"
            >
              {ENVIRONMENT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="glbUrl"
              className="text-sm font-medium text-slate-800 dark:text-slate-100"
            >
              GLB URL
            </label>
            <input
              id="glbUrl"
              name="glbUrl"
              type="url"
              defaultValue={exhibition.glbUrl}
              className="w-full rounded-xl border border-slate-300/60 bg-white/75 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-500/70 focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-400/35 dark:border-white/20 dark:bg-black/25 dark:text-white dark:placeholder:text-white/45"
              placeholder="https://cdn.example.com/model.glb"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-800 dark:text-slate-100">
            <input
              type="checkbox"
              name="isPublished"
              defaultChecked={exhibition.isPublished}
              className="h-4 w-4 rounded border-slate-400 text-cyan-500 focus:ring-cyan-400/50 dark:border-white/30"
            />
            Published
          </label>

          <button
            type="submit"
            className="rounded-xl border border-cyan-500/45 bg-cyan-500/20 px-4 py-2.5 text-sm font-medium text-slate-900 transition hover:bg-cyan-500/30 dark:text-white"
          >
            Save Changes
          </button>
        </form>
      </GlassFormPanel>

      <GlassFormPanel
        title="Embed"
        subtitle="Use this iframe snippet to embed the published exhibition."
      >
        <div className="space-y-3">
          <p className="text-xs text-white/70">Embed URL: {embedUrl}</p>
          <pre className="overflow-x-auto rounded-xl border border-white/15 bg-black/30 p-3 text-xs text-cyan-50">
            <code>{embedIframeCode}</code>
          </pre>
          <CopyTextButton value={embedIframeCode} />
        </div>
      </GlassFormPanel>

      <GlassFormPanel
        title="Delete Exhibition"
        subtitle="Safety check: type the exact title before deletion."
      >
        <form action={handleDelete} className="space-y-4">
          <input type="hidden" name="exhibitionId" value={exhibition.id} />
          <div className="space-y-2">
            <label
              htmlFor="confirmTitle"
              className="text-sm font-medium text-slate-800 dark:text-slate-100"
            >
              Type &quot;{exhibition.title}&quot; to confirm
            </label>
            <input
              id="confirmTitle"
              name="confirmTitle"
              type="text"
              required
              className="w-full rounded-xl border border-rose-300/50 bg-white/75 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-500/70 focus:border-rose-500/60 focus:ring-2 focus:ring-rose-400/35 dark:border-rose-200/35 dark:bg-black/25 dark:text-white dark:placeholder:text-white/45"
            />
          </div>

          <button
            type="submit"
            className="rounded-xl border border-rose-300/40 bg-rose-500/20 px-4 py-2.5 text-sm font-medium text-rose-900 transition hover:bg-rose-500/30 dark:text-rose-100"
          >
            Delete Exhibition
          </button>
        </form>
      </GlassFormPanel>
    </section>
  );
}

