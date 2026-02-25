import type { Metadata } from "next";
import Link from "next/link";
import { Camera, Check, ChevronRight, UploadCloud, Box, Zap } from "lucide-react";
import Navbar from "@/components/ui/Navbar";
import FadeIn from "@/components/ui/FadeIn";

export const metadata: Metadata = {
  title: "Foto zu 3D Modell: Anleitung, Tools & Workflow (2026) | 3D-Snap",
  description: "Lerne, wie du aus Fotos ein sauberes 3D-Modell erstellst: KI-Generator, Photogrammetrie oder iPhone-Scan. Mit Tipps zu Export und Cleanup.",
  alternates: {
    canonical: "https://3d-snap.com/foto-zu-3d-modell",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "3D-Snap",
  "operatingSystem": "Web Browser",
  "applicationCategory": "MultimediaApplication",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "EUR"
  },
  "description": "Ein KI-gestützter Foto zu 3D Modell Generator. Konvertiert einfache JPG und PNG Bilder in interaktive GLB und STL 3D-Modelle für Produktpräsentationen und Maker.",
  "url": "https://3d-snap.com",
  "featureList": [
    "KI-gestützte 3D-Generierung aus Einzelfotos",
    "GLB und STL Export",
    "Web-basierter interaktiver 3D-Viewer",
    "Material- und Farbkonfigurator"
  ]
};

export default function FotoZu3DModellPage() {
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
                Vom Foto zum fertigen 3D-Modell
              </h1>
            </FadeIn>

            <FadeIn delay={100}>
              <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed font-medium">
                Erfahre, wie du mit modernen Tools ein einfaches Foto in ein interaktives 3D-Modell verwandelst – ideal für Produktpräsentationen, Maker und Web-Entwicklung.
              </p>
            </FadeIn>

            <FadeIn delay={200}>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/register"
                  className="w-full sm:w-auto px-8 py-4 bg-[#00aaff] hover:bg-[#0088cc] text-white rounded-full font-medium transition-all shadow-[0_0_20px_rgba(0,170,255,0.4)] hover:shadow-[0_0_30px_rgba(0,170,255,0.6)] flex items-center justify-center gap-2 group"
                >
                  Jetzt erstes Modell generieren
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
              <h2 className="text-3xl font-bold text-white mb-6">Wie funktioniert &quot;Foto zu 3D&quot;?</h2>
              <p className="text-gray-300 mb-8">
                Früher brauchte man teure Scanner oder komplexes Wissen in Programmen wie Blender, um Objekte in 3D darzustellen. Heute gibt es im Wesentlichen drei zugängliche Methoden, um aus Fotos ein 3D-Modell zu erstellen:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                  <UploadCloud className="w-8 h-8 text-[#00aaff] mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">1. KI-Generatoren</h3>
                  <p className="text-sm text-gray-400">
                    Ein einzelnes Foto hochladen. Die KI schätzt Tiefe und Textur und generiert ein fertiges 3D-Modell in Minuten.
                  </p>
                </div>
                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                  <Camera className="w-8 h-8 text-emerald-400 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">2. Photogrammetrie</h3>
                  <p className="text-sm text-gray-400">
                    50 bis 200 Fotos von allen Seiten machen. Spezielle Software verrechnet diese zu einem sehr detaillierten Scan.
                  </p>
                </div>
                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                  <Box className="w-8 h-8 text-purple-400 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">3. LiDAR Scans</h3>
                  <p className="text-sm text-gray-400">
                    Mit dem iPhone (Pro-Modelle) Objekte abscannen. Schnell, aber oft weniger detailliert bei kleinen Gegenständen.
                  </p>
                </div>
              </div>

              <h2 className="text-3xl font-bold text-white mb-6">Vergleich: Photogrammetrie vs. LiDAR vs. KI-Generierung</h2>
              <div className="overflow-x-auto mb-12">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/20 text-gray-300">
                      <th className="p-4 font-semibold">Methode</th>
                      <th className="p-4 font-semibold">Benötigte Hardware</th>
                      <th className="p-4 font-semibold">Dauer</th>
                      <th className="p-4 font-semibold">Bester Einsatzzweck</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-400">
                    <tr className="border-b border-white/10 bg-white/5">
                      <td className="p-4 text-white font-medium">KI-Generator (z.B. 3D-Snap)</td>
                      <td className="p-4">Smartphone oder PC</td>
                      <td className="p-4">2 - 5 Minuten</td>
                      <td className="p-4">Digitalisierung, Web-Modelle, schnelle Assets</td>
                    </tr>
                    <tr className="border-b border-white/10">
                      <td className="p-4 text-white font-medium">Photogrammetrie</td>
                      <td className="p-4">DSLR-Kamera, starker PC</td>
                      <td className="p-4">Stunden bis Tage</td>
                      <td className="p-4">Museen, High-End Game Assets, Archivierung</td>
                    </tr>
                    <tr className="border-b border-white/10">
                      <td className="p-4 text-white font-medium">LiDAR Scan (iPhone)</td>
                      <td className="p-4">iPhone Pro / iPad Pro</td>
                      <td className="p-4">10 - 20 Minuten</td>
                      <td className="p-4">Räume, Möbel, große unbewegliche Objekte</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h2 className="text-3xl font-bold text-white mb-6">Der schnellste Weg: KI-Generierung</h2>
              <p className="text-gray-300 mb-6">
                Für Maker und Web-Projekte ist die KI-gestützte Methode aktuell der beste Kompromiss aus Geschwindigkeit und Qualität. Du lädst einfach ein Produktfoto (am besten mit gutem Licht und wenig Schatten) hoch, und die Software erledigt den Rest. Falls du wissen willst, wie du das perfekte Bild vorbereitest, lies unseren <Link href="/bild-zu-3d" className="text-[#00aaff] hover:underline">Guide zum Umwandeln von Bildern in 3D-Modelle</Link>.
              </p>

              <div className="bg-white/5 border border-white/10 p-8 rounded-2xl mb-12">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Zap className="w-6 h-6 text-amber-400" /> Best Practices für dein Foto
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-gray-300"><strong>Gute Ausleuchtung:</strong> Vermeide harte Schatten. Diffuses Tageslicht ist am besten.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-gray-300"><strong>Klarer Hintergrund:</strong> Stell das Objekt frei oder nutze einen neutralen Hintergrund.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-gray-300"><strong>Gute Auflösung:</strong> Scharfe Kanten helfen der KI, saubere Geometrie zu erzeugen.</span>
                  </li>
                </ul>
              </div>

              <h2 className="text-3xl font-bold text-white mb-6">Was passiert nach der Generierung?</h2>
              <p className="text-gray-300 mb-8">
                Das Modell wird meist als <code>.glb</code> oder <code>.obj</code> Datei exportiert. Mit Tools wie <strong>3D-Snap</strong> kannst du dieses Modell direkt im Browser betrachten, Materialien anpassen, Info-Hotspots hinzufügen und es als interaktiven Viewer auf deiner Website einbetten.
              </p>

              <div className="text-center mt-16">
                <h3 className="text-2xl font-bold text-white mb-6">Bereit, es auszuprobieren?</h3>
                <Link
                  href="/register"
                  className="inline-flex px-8 py-4 bg-[#00aaff] hover:bg-[#0088cc] text-white rounded-full font-medium transition-all shadow-[0_0_20px_rgba(0,170,255,0.4)] hover:shadow-[0_0_30px_rgba(0,170,255,0.6)] items-center gap-2"
                >
                  Jetzt erstes Modell generieren
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
              <Link href="/impressum" className="text-gray-400 hover:text-white transition-colors">Impressum</Link>
              <Link href="/datenschutz" className="text-gray-400 hover:text-white transition-colors">Datenschutz</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
