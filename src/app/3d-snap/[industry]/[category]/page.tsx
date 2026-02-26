import { notFound } from "next/navigation";
import { Metadata } from "next";
import { industries } from "@/data/industries";
import HomeSnapModule from "@/components/ui/HomeSnapModule";
import { CheckCircle2, Clock, DollarSign, Camera, Sparkles, Zap, ArrowRight, Share2 } from "lucide-react";
import Link from "next/link";

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

  // Schema.org HowTo Generation (for GEO authority)
  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": `So erstellst du ein 3D-Modell für ${category.name}`,
    "description": `Schritt-für-Schritt Anleitung zur Generierung eines photorealistischen 3D-Modells für ${category.name} aus einem einfachen Foto.`,
    "step": [
      {
        "@type": "HowToStep",
        "text": `Fotografiere dein ${category.name} aus einer stabilen Perspektive gemäß unseren Guidelines.`,
        "name": "Foto aufnehmen"
      },
      {
        "@type": "HowToStep",
        "text": "Lade das Bild in die 3D-Snap Pipeline hoch.",
        "name": "Upload"
      },
      {
        "@type": "HowToStep",
        "text": "Unsere KI generiert in Sekunden ein optimiertes GLB-Modell inklusive PBR-Texturen.",
        "name": "KI-Generierung"
      }
    ]
  };

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      <div className="container mx-auto px-6">
        {/* Breadcrumb / Kicker */}
        <div className="mb-6 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500">
          <Link href={`/3d-snap/${industry.slug}`} className="hover:text-[#00aaff] transition-colors">{industry.name}</Link>
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

        {/* Cinematic Preview Section (New) */}
        <div className="mb-32 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center bg-gradient-to-br from-[#00aaff]/10 to-transparent p-10 md:p-20 rounded-[4rem] border border-white/5">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00aaff]/20 border border-[#00aaff]/30 text-[#00aaff] text-[10px] font-black uppercase tracking-widest mb-6">
              <Sparkles size={12} /> Exklusives Feature
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-6">
              Von 3D zu <span className="text-[#00aaff]">Hollywood</span>. Automatisch.
            </h2>
            <p className="text-lg text-zinc-400 font-medium mb-8 leading-relaxed">
              Jedes gesnappte 3D-Modell kann automatisch in ein filmreifes Video verwandelt werden. Dank unserer Gemini Veo Integration erstellen wir für dich den perfekten Social Media Post für TikTok, Reels oder Shorts.
            </p>
            <ul className="space-y-4 mb-10">
              <li className="flex items-center gap-3 text-zinc-300 font-bold">
                <Zap size={18} className="text-[#00aaff]" /> KI-Kamerafahrten & Cinematic Lighting
              </li>
              <li className="flex items-center gap-3 text-zinc-300 font-bold">
                <Share2 size={18} className="text-[#00aaff]" /> Direkt-Upload zu TikTok & Instagram
              </li>
            </ul>
            <Link href="/login" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-black rounded-full hover:scale-105 transition-transform">
              Jetzt ausprobieren <ArrowRight size={18} />
            </Link>
          </div>
          <div className="lg:col-span-5 relative aspect-[9/16] max-w-[300px] mx-auto rounded-[2rem] overflow-hidden border-8 border-zinc-900 shadow-2xl">
             <div className="absolute inset-0 bg-zinc-800 animate-pulse flex items-center justify-center text-zinc-600 text-[10px] font-black uppercase tracking-widest text-center px-6">
                Hier erscheint dein Cinematic Showcase
             </div>
             {/* Placeholder for a sample video loop or image */}
             <div className="absolute bottom-6 left-6 right-6">
                <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                   <div className="h-full bg-[#00aaff] w-2/3" />
                </div>
             </div>
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

        {/* Related Categories (Internal Linking for SEO) */}
        <div className="mt-32 pt-20 border-t border-white/5">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-700 mb-10 text-center">Weitere Kategorien in {industry.name}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {industry.categories
              .filter(c => c.slug !== category.slug)
              .map((otherCat) => (
                <Link 
                  key={otherCat.slug}
                  href={`/3d-snap/${industry.slug}/${otherCat.slug}`}
                  className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#00aaff]/30 transition-all group"
                >
                  <div className="text-sm font-bold text-zinc-400 group-hover:text-white transition-colors">{otherCat.name} 3D Modell</div>
                  <div className="mt-2 text-[10px] font-black uppercase tracking-widest text-[#00aaff] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    Ansehen <ArrowRight size={10} />
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
