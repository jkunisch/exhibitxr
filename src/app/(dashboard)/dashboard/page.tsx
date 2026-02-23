import { Timestamp } from "firebase-admin/firestore";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getAdminDb } from "@/lib/firebaseAdmin";
import { getSessionUser } from "@/lib/session";

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

export default async function DashboardPage() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect("/login?next=/dashboard");
  }

  const exhibitions = await listTenantExhibitions(sessionUser.tenantId);

  return (
    <section className="rounded-2xl border border-white/15 bg-white/8 p-5 backdrop-blur-xl sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/75">
            Exhibitions
          </p>
          <h2 className="mt-1 text-xl font-semibold text-white">
            Current Tenant Collection
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm text-white/70">{exhibitions.length} entries</p>
          <Link
            href="/dashboard/exhibitions"
            className="rounded-lg border border-cyan-200/35 bg-cyan-300/15 px-3 py-2 text-xs font-medium text-cyan-100 transition hover:bg-cyan-300/25"
          >
            Open CRUD
          </Link>
        </div>
      </div>

      {exhibitions.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-white/20 bg-black/20 px-4 py-6 text-sm text-white/70">
          No exhibitions found for this tenant yet.
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {exhibitions.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-white/12 bg-black/20 px-4 py-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-white">{item.title}</p>
                  <p className="text-xs text-white/65">ID: {item.id}</p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    item.isPublished
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
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
