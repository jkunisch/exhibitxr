import { getSessionUser } from "@/lib/session";
import { getTenantExhibitionsStats } from "@/app/actions/analytics";
import { redirect } from "next/navigation";

export default async function AnalyticsPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/login");

  const stats = await getTenantExhibitionsStats(sessionUser.tenantId);

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-screen bg-[#09090b] text-white font-sans">
      <header className="mb-10">
        <h1 className="text-3xl font-bold mb-2">Analytics</h1>
        <p className="text-zinc-400">Uebersicht der Performance deiner Ausstellungen.</p>
      </header>

      {stats.length === 0 ? (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-12 text-center">
          <p className="text-zinc-500">Noch keine Daten verfügbar.</p>
        </div>
      ) : (
        <div className="grid gap-8">
          {stats.map((exhibit) => (
            <div key={exhibit.id} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                <h2 className="text-xl font-semibold">{exhibit.title}</h2>
                <div className="px-3 py-1 bg-zinc-800 rounded-full text-sm text-zinc-300">
                  {exhibit.totalViews} Gesamt-Views
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-6">Views pro Tag (letzte 14 Tage)</h3>
                <div className="flex items-end gap-2 h-40">
                  {getLast14Days().map((date) => {
                    const views = exhibit.dailyViews[date] || 0;
                    const maxViews = Math.max(...Object.values(exhibit.dailyViews) as number[], 10);
                    const height = (views / maxViews) * 100;
                    
                    return (
                      <div key={date} className="flex-1 flex flex-col items-center group relative">
                        <div 
                          className="w-full bg-blue-500/20 group-hover:bg-blue-500/40 border-t-2 border-blue-500 transition-all rounded-t-sm"
                          style={{ height: `${Math.max(height, 2)}%` }}
                        >
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                            {views}
                          </div>
                        </div>
                        <div className="mt-2 text-[10px] text-zinc-500 rotate-45 origin-left">
                          {date.split("-").slice(1).join("/")}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-3 divide-x divide-zinc-800 border-t border-zinc-800">
                <div className="p-6 text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {Object.values(exhibit.monthlyViews).reduce((a: any, b: any) => a + b, 0)}
                  </div>
                  <div className="text-xs text-zinc-500 uppercase mt-1">Monatliche Views</div>
                </div>
                <div className="p-6 text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {/* Placeholder für Interaktionsrate */}
                    8.4%
                  </div>
                  <div className="text-xs text-zinc-500 uppercase mt-1">Interaktionsrate</div>
                </div>
                <div className="p-6 text-center">
                  <div className="text-2xl font-bold text-emerald-400">
                    {/* Placeholder für Verweildauer */}
                    1:42
                  </div>
                  <div className="text-xs text-zinc-500 uppercase mt-1">Ø Verweildauer</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getLast14Days() {
  const dates = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}
