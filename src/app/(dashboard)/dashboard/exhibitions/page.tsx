import { Timestamp } from "firebase-admin/firestore";
import { Download, Pencil } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { DeleteExhibitionButton } from "@/components/dashboard/DeleteExhibitionButton";

import { getAdminDb } from "@/lib/firebaseAdmin";
import type { PlanTier } from "@/lib/planLimits";
import { getSessionUser } from "@/lib/session";
import {
  type TenantEntitlementSnapshot,
  getTenantEntitlementSnapshot,
} from "@/lib/tenantEntitlements";

export const dynamic = "force-dynamic";

type ExhibitionsPageSearchParams = Promise<{
  deleted?: string | string[];
}>;

type ExhibitionListItem = {
  id: string;
  title: string;
  description: string;
  isPublished: boolean;
  environment: string;
  updatedAtMs: number;
  updatedAtLabel: string;
  glbUrl: string | null;
};

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

function getDateMillis(value: unknown): number {
  if (value instanceof Timestamp) {
    return value.toDate().getTime();
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.getTime();
    }
  }

  return 0;
}

function asNonEmptyString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : fallback;
}

async function listTenantExhibitions(
  tenantId: string,
): Promise<ExhibitionListItem[]> {
  const adminDb = getAdminDb();
  const snapshot = await adminDb
    .collection("tenants")
    .doc(tenantId)
    .collection("exhibitions")
    .limit(100)
    .get();

  const items = snapshot.docs
    .map((document) => {
      const data = document.data();

      return {
        id: document.id,
        title: asNonEmptyString(data.title, "Untitled exhibition"),
        description: asNonEmptyString(data.description, "No description"),
        isPublished: data.isPublished === true,
        environment: asNonEmptyString(data.environment, "studio"),
        updatedAtMs: getDateMillis(data.updatedAt),
        updatedAtLabel: formatDate(data.updatedAt),
        glbUrl: typeof data.model?.glbUrl === "string" ? data.model.glbUrl
          : typeof data.glbUrl === "string" ? data.glbUrl
            : null,
      };
    })
    .sort((left, right) => right.updatedAtMs - left.updatedAtMs);

  return items;
}

function wasDeleted(value: string | string[] | undefined): boolean {
  return value === "1";
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Unknown error while loading exhibitions.";
}

function formatPlanLabel(plan: PlanTier): string {
  switch (plan) {
    case "free":
      return "Free";
    case "starter":
      return "Starter";
    case "pro":
      return "Pro";
    case "enterprise":
      return "Enterprise";
    default:
      return "Free";
  }
}

export default async function ExhibitionsPage({
  searchParams,
}: {
  searchParams: ExhibitionsPageSearchParams;
}) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect("/login?next=/dashboard/exhibitions");
  }

  const resolvedSearchParams = await searchParams;
  const showDeletedBanner = wasDeleted(resolvedSearchParams.deleted);

  let exhibitions: ExhibitionListItem[] = [];
  let entitlements: TenantEntitlementSnapshot | null = null;
  let errorMessage: string | null = null;

  try {
    [exhibitions, entitlements] = await Promise.all([
      listTenantExhibitions(sessionUser.tenantId),
      getTenantEntitlementSnapshot(sessionUser.tenantId),
    ]);
  } catch (error) {
    errorMessage = getErrorMessage(error);
  }

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-white/15 bg-white/8 p-5 backdrop-blur-xl sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/75">
              Exhibitions
            </p>
            <h2 className="mt-1 text-xl font-semibold text-white">
              Ausstellungen verwalten
            </h2>
            <p className="mt-1 text-sm text-white/70">
              Erstelle und bearbeite deine 3D-Ausstellungen.
            </p>
            {entitlements ? (
              <p className="mt-1 text-xs text-white/60">
                Plan {formatPlanLabel(entitlements.plan)}: {entitlements.currentExhibitions}/
                {entitlements.maxExhibitions} genutzt
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {entitlements?.canCreateExhibition ? (
              <Link
                href="/dashboard/exhibitions/new"
                className="rounded-xl border border-cyan-200/40 bg-cyan-300/15 px-4 py-2 text-sm font-medium text-cyan-50 transition hover:bg-cyan-300/25"
              >
                + Neue Ausstellung
              </Link>
            ) : (
              <Link
                href="/dashboard/billing"
                className="rounded-xl border border-amber-200/35 bg-amber-300/15 px-4 py-2 text-sm font-medium text-amber-100 transition hover:bg-amber-300/25"
              >
                Upgrade
              </Link>
            )}
          </div>
        </div>
      </div>

      {entitlements && !entitlements.canCreateExhibition ? (
        <div className="rounded-xl border border-amber-200/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Plan-Limit für {formatPlanLabel(entitlements.plan)} erreicht.
          {" "}<Link href="/dashboard/billing" className="underline hover:text-white">Upgrade</Link>
        </div>
      ) : null}

      {showDeletedBanner ? (
        <div className="rounded-xl border border-emerald-200/35 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          Ausstellung gelöscht.
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-2xl border border-rose-200/35 bg-rose-500/10 p-5 text-sm text-rose-100 backdrop-blur-xl sm:p-6">
          <p className="font-medium">Ausstellungen konnten nicht geladen werden.</p>
          <p className="mt-1 text-rose-100/85">{errorMessage}</p>
          <Link
            href="/dashboard/exhibitions"
            className="mt-4 inline-flex rounded-lg border border-rose-100/30 bg-rose-400/20 px-3 py-2 text-xs font-medium text-rose-50 transition hover:bg-rose-400/30"
          >
            Retry
          </Link>
        </div>
      ) : exhibitions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/20 bg-black/20 p-6 text-sm text-white/75 backdrop-blur-xl">
          Noch keine Ausstellungen vorhanden.
        </div>
      ) : (
        <ul className="space-y-3">
          {exhibitions.map((item) => (
            <li
              key={item.id}
              className="rounded-2xl border border-white/12 bg-black/20 p-4 backdrop-blur-xl"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-white">{item.title}</p>
                  <p className="text-xs text-white/60">{item.description}</p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.isPublished
                    ? "border border-emerald-200/40 bg-emerald-300/15 text-emerald-100"
                    : "border border-amber-200/35 bg-amber-300/15 text-amber-100"
                    }`}
                >
                  {item.isPublished ? "Published" : "Draft"}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-white/65">
                <span>Environment: {item.environment}</span>
                <span>Updated: {item.updatedAtLabel}</span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Link
                  href={`/dashboard/exhibitions/${item.id}`}
                  className="inline-flex rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/15"
                >
                  Details
                </Link>
                <Link
                  href={`/dashboard/editor/${item.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-300/35 bg-cyan-300/15 px-3 py-2 text-xs font-medium text-cyan-50 transition hover:bg-cyan-300/25"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Bearbeiten
                </Link>
                {item.glbUrl ? (
                  <a
                    href={item.glbUrl}
                    download={`${item.title.replace(/\s+/g, "_")}.glb`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300/35 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-200 transition hover:bg-emerald-500/20"
                  >
                    <Download className="h-3.5 w-3.5" />
                    GLB
                  </a>
                ) : null}
                <DeleteExhibitionButton
                  exhibitionId={item.id}
                  tenantId={sessionUser.tenantId}
                  exhibitionTitle={item.title}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

