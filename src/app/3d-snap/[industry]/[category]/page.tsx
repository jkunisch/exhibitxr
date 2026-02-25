import { notFound } from "next/navigation";
import { Metadata } from "next";
import { industries } from "@/data/industries";
import HomeSnapModule from "@/components/ui/HomeSnapModule";
import { CheckCircle2, Clock, DollarSign, Camera } from "lucide-react";

interface PageProps {
  params: Promise<{
    industry: string;
    category: string;
  }>;
}

// 1. Static Paths Generation for blazing fast loading (< 50ms TTFB)
export async function generateStaticParams() {
  const paths: Array<{ industry: string; category: string }> = [];

  Object.values(industries).forEach((ind) => {
    ind.categories.forEach((cat) => {
      paths.push({
        industry: ind.slug,
        category: cat.slug,
      });
    });
  });

  return paths;
}

// 2. Dynamic Metadata Injection (SEO & Social Sharing)
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const industry = industries[resolvedParams.industry];
  const category = industry?.categories.find((c) => c.slug === resolvedParams.category);

  if (!industry || !category) return {};

  return {
    title: `3D-Modell für ${category.name} erstellen | 3D-Snap by ExhibitXR`,
    description: `Hör auf für teure Agenturen zu bezahlen. Snap dein ${category.name} in Sekunden. ${category.description}`,
    openGraph: {
      title: `${category.name} 3D-Snappen`,
      description: category.description,
    },
  };
}

// 3. The Core Page Component
export default async function CategoryPage({ params }: PageProps) {
  const resolvedParams = await params;
  const industry = industries[resolvedParams.industry];
  const category = industry?.categories.find((c) => c.slug === resolvedParams.category);

  if (!industry || !category) {
    notFound();
  }

  // Schema.org FAQ Generation
  const faqSchema = category.faq
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: category.faq.map((q) => ({
          "@type": "Question",
          name: q.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: q.answer,
          },
        })),
      }
    : null;

  return (
    <div className="min-h-screen bg-[#010102] text-white pt-32 pb-24">
      {/* Schema Injection */}
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      <div className="container mx-auto px-6">
        {/* Breadcrumb / Kicker */}
        <div className="mb-6 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
          <span className="text-[#00aaff]">{industry.name}</span>
          <span>/</span>
          <span className="text-white">{category.name}</span>
        </div>

        {/* Dynamic Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-32">
          <div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 leading-[1.1]">
              Hör auf, für <span className="text-[#00aaff] block">{category.name}</span> zu bezahlen.
            </h1>
            <p className="text-xl text-zinc-400 font-medium mb-10 max-w-lg">
              {category.description} Zieh ein Foto rein, erhalte ein Commerce-ready 3D-Asset.
            </p>

            {/* Value Props / ROI */}
            {category.roi_defaults && (
              <div className="grid grid-cols-2 gap-4 mb-10">
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 text-zinc-400 mb-2 text-xs font-bold uppercase tracking-widest">
                    <Clock size={14} /> Agentur Dauer
                  </div>
                  <div className="text-2xl font-black text-red-400 line-through decoration-red-500/50">
                    {category.roi_defaults.agencyTime}
                  </div>
                  <div className="text-sm font-bold text-green-400 mt-1">
                    3D-Snap: {category.roi_defaults.snapTime}
                  </div>
                </div>
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 text-zinc-400 mb-2 text-xs font-bold uppercase tracking-widest">
                    <DollarSign size={14} /> Agentur Kosten
                  </div>
                  <div className="text-2xl font-black text-red-400 line-through decoration-red-500/50">
                    {category.roi_defaults.agencyCost}
                  </div>
                  <div className="text-sm font-bold text-green-400 mt-1">
                    3D-Snap: Cents pro SKU
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Core: The HomeSnapModule acts as the Proof of Work */}
          <div className="relative rounded-[3rem] overflow-hidden border border-white/10 bg-[#050507] shadow-2xl min-h-[500px]">
            <HomeSnapModule />
          </div>
        </div>

        {/* Dynamic Tips & Quality Section */}
        {(category.snap_tips || category.quality_targets) && (
          <div className="max-w-4xl mx-auto bg-zinc-900/40 rounded-[3rem] p-10 md:p-16 border border-white/5">
            <h2 className="text-3xl font-black tracking-tighter mb-10 text-center">
              Der perfekte Snap für <span className="text-[#00aaff]">{category.name}</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {category.snap_tips && (
                <div>
                  <h3 className="flex items-center gap-3 text-lg font-bold mb-6">
                    <Camera className="text-[#00aaff]" /> Foto-Guidelines
                  </h3>
                  <ul className="space-y-4">
                    {category.snap_tips.map((tip, idx) => (
                      <li key={idx} className="flex gap-3 text-zinc-300">
                        <CheckCircle2 size={20} className="text-green-500 shrink-0" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {category.quality_targets && (
                <div>
                  <h3 className="text-lg font-bold mb-6">Commerce-Ready Garantie</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 rounded-xl bg-black/50 border border-white/5">
                      <span className="text-zinc-400 font-bold">Zieldateigröße:</span>
                      <span className="font-black text-white">{category.quality_targets.fileSize}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 rounded-xl bg-black/50 border border-white/5">
                      <span className="text-zinc-400 font-bold">Polycount:</span>
                      <span className="font-black text-white">{category.quality_targets.polycount}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
