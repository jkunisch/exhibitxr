import { getSessionUser } from "@/lib/session";
import { getTenantExhibitionsStats } from "@/app/actions/analytics";
import { redirect } from "next/navigation";
import StudioCard from "@/components/ui/StudioCard";
import Link from "next/link";
import { ChevronLeft, BarChart3, TrendingUp, Users, Clock } from "lucide-react";

export default async function AnalyticsPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/login");

  const stats = await getTenantExhibitionsStats(sessionUser.tenantId);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-white">Analytics</h2>
          <p className="mt-2 text-zinc-500 font-medium">Performance-Metriken Ihrer 3D-Showrooms.</p>
        </div>
        <Link
          href="/dashboard"
          className="group flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-6 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400 transition-all hover:bg-white/10 hover:text-white"
        >
          <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Zurück
        </Link>
      </div>

      {stats.length === 0 ? (
        <StudioCard className="flex flex-col items-center justify-center py-20 text-center">
           <BarChart3 size={48} className="text-zinc-800 mb-6" />
           <p className="text-zinc-500 font-medium">Noch keine Analysedaten verfügbar.</p>
           <p className="text-xs text-zinc-700 mt-2 uppercase font-black tracking-widest">Warten auf erste Besuche...</p>
        </StudioCard>
      ) : (
        <div className="space-y-12">
          {stats.map((exhibit, idx) => (
            <div key={exhibit.id} className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-700 px-2">{exhibit.title}</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                 
                 {/* Chart Card */}
                 <StudioCard delay={idx * 0.1} className="lg:col-span-8 p-10 flex flex-col justify-between min-h-[400px]">
                    <div>
                       <div className="flex justify-between items-start mb-10">
                          <div>
                             <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">Besucher-Trend</p>
                             <h4 className="text-2xl font-black tracking-tight text-white">Letzte 14 Tage</h4>
                          </div>
                          <div className="px-4 py-2 bg-white/5 border border-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-zinc-400">
                             {exhibit.totalViews} Gesamt-Views
                          </div>
                       </div>
                    </div>

                    <div className="flex items-end gap-3 h-48 w-full mt-10">
                      {getLast14Days().map((date) => {
                        const views = exhibit.dailyViews[date] || 0;
                        const maxViews = Math.max(...Object.values(exhibit.dailyViews) as number[], 10);
                        const height = (views / maxViews) * 100;
                        
                        return (
                          <div key={date} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-black px-2 py-1 rounded-sm opacity-0 group-hover:opacity-100 pointer-events-none transition-all scale-75 group-hover:scale-100">
                              {views}
                            </div>
                            <div 
                              className="w-full bg-white/5 group-hover:bg-white/10 border-t border-white/20 transition-all rounded-t-lg relative"
                              style={{ height: `${Math.max(height, 4)}%` }}
                            >
                               {views > 0 && <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/10 to-transparent" />}
                            </div>
                            <div className="mt-4 text-[9px] font-black uppercase tracking-tighter text-zinc-700 group-hover:text-zinc-500 transition-colors">
                              {date.split("-").slice(1).join("/")}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                 </StudioCard>

                 {/* Stats Bento Grid */}
                 <div className="lg:col-span-4 grid grid-cols-1 gap-6">
                    <StudioCard delay={idx * 0.1 + 0.1} className="p-8 flex items-center gap-6">
                       <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-zinc-400">
                          <TrendingUp size={20} />
                       </div>
                       <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">Monatliche Views</p>
                          <h5 className="text-2xl font-black text-white">
                             {Object.values(exhibit.monthlyViews)
                               .reduce<number>(
                                 (sum, views) =>
                                   typeof views === "number" ? sum + views : sum,
                                 0,
                               )
                               .toLocaleString()}
                          </h5>
                       </div>
                    </StudioCard>

                    <StudioCard delay={idx * 0.1 + 0.2} className="p-8 flex items-center gap-6">
                       <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-zinc-400">
                          <Users size={20} />
                       </div>
                       <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">Interaktionsrate</p>
                          <h5 className="text-2xl font-black text-white">8.4%</h5>
                       </div>
                    </StudioCard>

                    <StudioCard delay={idx * 0.1 + 0.3} className="p-8 flex items-center gap-6 border-white/10 bg-white/[0.02]">
                       <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center">
                          <Clock size={20} />
                       </div>
                       <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">Ø Verweildauer</p>
                          <h5 className="text-2xl font-black text-white">1:42 Min</h5>
                       </div>
                    </StudioCard>
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
