import type { Metadata } from "next";
import Link from "next/link";
import { Image as ImageIcon, Check, ChevronRight, UploadCloud, MonitorPlay, Zap } from "lucide-react";
import Navbar from "@/components/ui/Navbar";
import FadeIn from "@/components/ui/FadeIn";

export const metadata: Metadata = {
  title: "Bild zu 3D Modell umwandeln: So geht's (2026) | 3D-Snap",
  description: "Schritt-für-Schritt Anleitung: Bilder/Fotos in 3D-Modelle verwandeln. Methoden, Software, typische Fehler und bessere Ergebnisse.",
  alternates: {
    canonical: "https://3d-snap.com/bild-zu-3d",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "Ein Bild in ein 3D-Modell umwandeln",
  "description": "Erfahre, wie du mit KI-Tools ein einzelnes Bild in ein interaktives 3D-Modell verwandelst.",
  "step": [
    {
      "@type": "HowToStep",
      "name": "Schritt 1: Das perfekte Bild wählen",
      "text": "Nimm ein hochauflösendes Bild deines Produktes. Das Objekt sollte zentral im Bild liegen und gut ausgeleuchtet sein."
    },
    {
      "@type": "HowToStep",
      "name": "Schritt 2: KI-Upload",
      "text": "Lade dein Bild in einen KI-Generator wie 3D-Snap hoch. Die KI erzeugt automatisch Polygone und die Textur."
    },
    {
      "@type": "HowToStep",
      "name": "Schritt 3: 3D-Modell einbinden",
      "text": "Exportiere das generierte Modell als .glb oder bette es über einen iframe Viewer direkt auf deiner Website ein."
    }
  ]
};

export default function BildZu3DPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white selection:bg-[#00aaff]/30">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-20 pointer-events-none blur-[120px] bg-gradient-to-b from-[#00aaff] to-transparent rounded-full" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <FadeIn>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
                Bild in 3D-Modell umwandeln
              </h1>
            </FadeIn>

            <FadeIn delay={100}>
              <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed font-medium">
                Mache deine Produktbilder greifbar. Die einfachste Anleitung, um aus einem flachen 2D-Bild ein dreidimensionales, interaktives Modell zu erzeugen.
              </p>
            </FadeIn>

            <FadeIn delay={200}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/register"
                  className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-gray-100 text-black rounded-full font-bold transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2 group"
                >
                  Kostenlos ausprobieren
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* CONTENT SECTION */}
      <section className="py-20 relative z-20 bg-black/50 border-t border-white/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <FadeIn>
            <div className="prose prose-invert prose-lg max-w-none">
              
              <h2 className="text-3xl font-bold text-white mb-6">Warum Bilder in 3D umwandeln?</h2>
              <p className="text-gray-300 mb-8">
                Online-Shopper können Produkte nicht anfassen. Ein flaches Bild (JPG, PNG) liefert nur eine Perspektive. Ein 3D-Modell hingegen lässt sich drehen, zoomen und von allen Seiten betrachten. Das steigert das Vertrauen und reduziert Retouren signifikant. Wenn du mehr über die grundsätzlichen Technologien (wie Photogrammetrie) erfahren willst, schau dir unseren Artikel über <Link href="/foto-zu-3d-modell" className="text-[#00aaff] hover:underline">Tools und Workflows für Foto zu 3D Modelle</Link> an.
              </p>

              <h2 className="text-3xl font-bold text-white mb-6">So funktioniert der Workflow</h2>
              
              <div className="space-y-6 mb-12">
                <div className="flex gap-4 items-start bg-white/5 border border-white/10 p-6 rounded-2xl">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#00aaff]/20 text-[#00aaff]">
                    <ImageIcon size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Schritt 1: Das perfekte Bild wählen</h3>
                    <p className="text-sm text-gray-400">
                      Nimm ein hochauflösendes Bild deines Produktes. Das Objekt sollte zentral im Bild liegen und gut ausgeleuchtet sein. Verzichte auf extreme Filter oder Lens-Flares.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4 items-start bg-white/5 border border-white/10 p-6 rounded-2xl">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#00aaff]/20 text-[#00aaff]">
                    <UploadCloud size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Schritt 2: KI-Upload</h3>
                    <p className="text-sm text-gray-400">
                      Lade dein Bild in einen KI-Generator wie 3D-Snap hoch. Die KI analysiert die Strukturen und erzeugt daraus automatisch Polygone (die Gitterstruktur deines 3D-Modells) und die dazugehörige Textur.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start bg-white/5 border border-white/10 p-6 rounded-2xl">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#00aaff]/20 text-[#00aaff]">
                    <MonitorPlay size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Schritt 3: 3D-Modell einbinden</h3>
                    <p className="text-sm text-gray-400">
                      Du erhältst eine <code>.glb</code> Datei. Über unser Dashboard kannst du Materialien verfeinern und erhältst einen einfachen HTML-Code, mit dem du den interaktiven 3D-Showroom auf deiner Website einbinden kannst.
                    </p>
                  </div>
                </div>
              </div>

              <h2 className="text-3xl font-bold text-white mb-6">Typische Fehler (und wie du sie vermeidest)</h2>
              <div className="bg-rose-500/10 border border-rose-500/20 p-8 rounded-2xl mb-12">
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="text-rose-400 font-bold mt-0.5">✗</span>
                    <span className="text-gray-300"><strong>Transparente Objekte:</strong> Glas oder durchsichtiges Plastik kann von KIs oft nicht richtig interpretiert werden. Die Modelle sehen oft "geschmolzen" aus.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-rose-400 font-bold mt-0.5">✗</span>
                    <span className="text-gray-300"><strong>Zu viel Perspektive:</strong> Bilder, die stark verzerrt sind (z.B. Fischaugenobjektiv), führen zu unproportionierten 3D-Ergebnissen.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-rose-400 font-bold mt-0.5">✗</span>
                    <span className="text-gray-300"><strong>Starke Reflexionen:</strong> Ein Spiegel oder stark glänzendes Chrom lenkt die KI ab, da sich die Umgebung im Objekt spiegelt.</span>
                  </li>
                </ul>
              </div>

              <div className="text-center mt-16">
                <Link
                  href="/register"
                  className="inline-flex px-8 py-4 bg-white hover:bg-gray-100 text-black rounded-full font-bold transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] items-center gap-2"
                >
                  Jetzt Bild umwandeln
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

            </div>
          </FadeIn>
        </div>
      </section>
      
      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-black pt-16 pb-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-12">
            <Link href="/" className="text-2xl font-bold tracking-tighter text-white mb-6 md:mb-0">
              3D-<span className="text-[#00aaff]">Snap</span>
            </Link>
            <div className="flex flex-wrap justify-center gap-8">
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">Impressum</Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">Datenschutz</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
