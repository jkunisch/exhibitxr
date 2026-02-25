import { Timestamp } from "firebase-admin/firestore";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getAdminDb } from "@/lib/firebaseAdmin";
import type { PlanTier } from "@/lib/planLimits";
import { getSessionUser } from "@/lib/session";
import { getTenantEntitlementSnapshot } from "@/lib/tenantEntitlements";

export const dynamic = "force-dynamic";

type ExhibitionListItem = {
  id: string;
  title: string;
  isPublished: boolean;
  updatedAtLabel: string;
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

async function listTenantExhibitions(tenantId: string): Promise<ExhibitionListItem[]> {
  const adminDb = getAdminDb();
  const snapshot = await adminDb
    .collection("tenants")
    .doc(tenantId)
    .collection("exhibitions")
    .limit(20)
    .get();

  const items = snapshot.docs
    .map((document) => {
      const data = document.data();
      const title =
        typeof data.title === "string" && data.title.trim().length > 0
          ? data.title
          : "Untitled exhibition";

      const updatedAt =
        data.updatedAt instanceof Timestamp
          ? data.updatedAt.toDate().getTime()
          : 0;

      return {
        id: document.id,
        title,
        isPublished: data.isPublished === true,
        updatedAtLabel: formatDate(data.updatedAt),
        updatedAt,
      };
    })
    .sort((left, right) => right.updatedAt - left.updatedAt);

  return items.map((item) => ({
    id: item.id,
    title: item.title,
    isPublished: item.isPublished,
    updatedAtLabel: item.updatedAtLabel,
  }));
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

export default async function DashboardPage() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect("/login?next=/dashboard");
  }

  const [exhibitions, entitlements] = await Promise.all([
    listTenantExhibitions(sessionUser.tenantId),
    getTenantEntitlementSnapshot(sessionUser.tenantId),
  ]);

  return (
    <section className="rounded-2xl border border-white/15 bg-white/8 p-5 backdrop-blur-xl sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/75">
            Exhibitions
          </p>
          <h2 className="mt-1 text-xl font-semibold text-white">
            Meine Ausstellungen
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm text-white/70">{exhibitions.length} Einträge</p>
          <p className="text-xs text-white/65">
            Plan {formatPlanLabel(entitlements.plan)}: {entitlements.currentExhibitions}/
            {entitlements.maxExhibitions} genutzt
          </p>
          {entitlements.canCreateExhibition ? (
            <Link
              href="/dashboard/exhibitions/new"
              className="rounded-lg border border-cyan-200/40 bg-cyan-300/15 px-4 py-2 text-xs font-medium text-cyan-50 transition hover:bg-cyan-300/25"
            >
              + Neue Ausstellung
            </Link>
          ) : (
            <Link
              href="/dashboard/billing"
              className="rounded-lg border border-amber-200/35 bg-amber-300/15 px-3 py-2 text-xs font-medium text-amber-100 transition hover:bg-amber-300/25"
              title="Plan-Limit erreicht — Upgrade nötig"
            >
              Upgrade
            </Link>
          )}
        </div>
      </div>

      {exhibitions.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-white/20 bg-black/20 px-4 py-6 text-sm text-white/70">
          Noch keine Ausstellungen vorhanden.
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {exhibitions.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-white/12 bg-black/20 px-4 py-3 transition hover:border-white/25 hover:bg-white/[0.04]"
            >
              <Link href={`/dashboard/editor/${item.id}`} className="block">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-white">{item.title}</p>
                    <p className="text-xs text-white/65">ID: {item.id}</p>
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
                <p className="mt-2 text-xs text-white/60">
                  Updated: {item.updatedAtLabel}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
